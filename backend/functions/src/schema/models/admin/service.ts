import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { BaseService } from "../../core/services";
import axios from "axios";
import { permissionsCheck } from "../../core/helpers/permissions";
import { env } from "../../../config";
import {
  DiscordChannel,
  Event,
  EventEra,
  ExternalLinkBackup,
  File,
  Submission,
} from "../../services";
import { getGuildMemberId, sendDiscordRequest } from "../../helpers/discord";
import { submissionStatusKenum } from "../../enums";
import { Request } from "express";
import { SqlWhereFieldObject } from "../../core/helpers/sql";
import { isTimeoutImminent } from "../../core/helpers/shared";
import { TimeoutError } from "../../core/helpers/error";
import { isCdnUrl, isFileUrl } from "../../helpers/common";
import * as admin from "firebase-admin";
import { knex } from "../../../utils/knex";

const prodResource = axios.create({
  baseURL: "https://api.imgur.com/3",
});

export class AdminService extends BaseService {
  accessControl: AccessControlMap = {};

  @permissionsCheck("discord")
  async sendDiscordRequest({
    req,
    fieldPath,
    args,
    query,
    isAdmin = false,
  }: ServiceFunctionInputs) {
    const validatedArgs = <any>args;

    if (
      !["get", "post", "put", "delete", "patch"].includes(validatedArgs.method)
    )
      throw new Error(`Invalid method: ${validatedArgs.method}`);

    return sendDiscordRequest(
      validatedArgs.method,
      validatedArgs.path,
      validatedArgs.params
    );
  }

  @permissionsCheck("admin")
  async executeAdminFunction({
    req,
    fieldPath,
    args,
    query,
    isAdmin = false,
  }: ServiceFunctionInputs) {
    const validatedArgs = <any>args;

    /*
    // fetch all links from a channel
    const allLinksSet = await this.fetchAllLinksFromChannel(
      "619593082790346787"
    );

    const allLinksStr = [...allLinksSet].join("\n");
    fs.writeFileSync("src/abc.txt", allLinksStr);
    */

    // await this.syncAllIsRelevantRecord();

    // await this.convertSubmissionExternalLinks(args);

    // await this.refreshAllDiscordLeaderboard();

    // await this.backupNecessarySubmissionEvidence(req.user!.id);

    // await this.fixSubmissionExternalLinks(args);

    // await this.deleteBadFiles();

    // await this.addEras(req.user!.id);

    return "done";
  }

  async addEras(userId: string) {
    // corrupted gauntlet-related events (6) and the new DT2 boss events (4)
    const excludeEventsArray = [
      "sxqr8l7a",
      "7wq0afw6",
      "xgi3ae3n",
      "l01byt2r",
      "sptdofn8",
      "mxn0ukzs",
      "sjxy20va",
      "yvyynkqo",
      "x4cppho6",
      "s5cg0ptb",
    ];

    await knex.transaction(async (transaction) => {
      // get all current eventEras, excluding events for ones in the array
      const eventEras = await EventEra.getAllSqlRecord({
        select: ["id", "event.id"],
        where: [
          {
            field: "event",
            operator: "nin",
            value: excludeEventsArray,
          },
          {
            field: "isCurrent",
            operator: "eq",
            value: true,
          },
        ],
        transaction,
      });

      for (const eventEra of eventEras) {
        // for each eventEra, add a new one, set the existing one's name to Pre-DT2, isCurrent to false
        // add new one
        await EventEra.createSqlRecord({
          fields: {
            name: "Current Era",
            event: eventEra["event.id"],
            beginDate: 1690344000, // 7-26-2023 in unix time
            endDate: null,
            isBuff: true,
            isRelevant: true,
            isCurrent: true,
            createdBy: userId,
          },
          transaction,
        });

        await EventEra.updateSqlRecord({
          fields: {
            name: "Pre-DT2",
            isCurrent: false,
            isBuff: true,
            endDate: 1690344000, // 7-26-2023 in unix time
          },
          where: {
            id: eventEra.id,
          },
          transaction,
        });
      }
    });
  }

  async deleteBadFiles() {
    await File.deleteSqlRecord({
      where: [
        {
          field: "name",
          operator: "regex",
          value: /cdn\.osrsrecords\.com/,
        },
      ],
    });

    await ExternalLinkBackup.deleteSqlRecord({
      where: [
        {
          field: "url",
          operator: "regex",
          value: /cdn\.osrsrecords\.com/,
        },
      ],
    });

    const files = await File.getAllSqlRecord({
      select: ["id", "name", "location"],
      where: [
        {
          field: "name",
          operator: "regex",
          value: /cdn\.osrsrecords\.com/,
        },
      ],
    });

    const backups = await ExternalLinkBackup.getAllSqlRecord({
      select: ["id", "url"],
      where: [
        {
          field: "url",
          operator: "regex",
          value: /cdn\.osrsrecords\.com/,
        },
      ],
    });

    // const bucket = admin.storage().bucket();

    /*
    for (const file of files) {
      console.log(await bucket.file(`source/${file.location}`).exists());
    }
    */
  }

  // backup submission evidence where necessary
  // run this if there are some links that were not correctly converted to CDN urls
  async backupNecessarySubmissionEvidence(userId) {
    const submissions = await Submission.getAllSqlRecord({
      select: ["id", "externalLinks"],
      where: {
        status: submissionStatusKenum.APPROVED.index,
      },
    });

    for (const submission of submissions) {
      let needsUpdating = false;
      submission.externalLinks.forEach((link) => {
        if (isFileUrl(link) && !isCdnUrl(link)) {
          needsUpdating = true;
        }
      });

      if (needsUpdating) {
        await knex.transaction(async (transaction) => {
          await ExternalLinkBackup.backupExternalLinks(
            submission.id,
            userId,
            submission.externalLinks,
            transaction
          );
        });
      }
    }
  }

  // refreshes all the discord leaderboards
  async refreshAllDiscordLeaderboard() {
    const discordChannels = await DiscordChannel.getAllSqlRecord({
      select: ["id"],
      where: [],
    });

    for (const discordChannel of discordChannels) {
      await DiscordChannel.renderOutput(discordChannel.id, []);
    }
  }

  // goes through all the APPROVED submissions and replaces any externalLink elements that are backed up as a file (add the file extension)
  async fixSubmissionExternalLinks(after: string | null) {
    // look up all of the externalBackupLinks
    const externalLinkBackups = await ExternalLinkBackup.getAllSqlRecord({
      select: ["id", "url", "file.id"],
      where: [],
    });

    // create the /f/abc -> /f/abc.png map
    const linkMap: Map<string, string> = new Map();

    externalLinkBackups.forEach((backup) => {
      const extension = backup.url.split(".").pop();

      linkMap.set(
        `${env.site.cdn_url}/f/${backup["file.id"]}`,
        `${backup["file.id"]}.${extension}`
      );
    });

    const whereObject: SqlWhereFieldObject[] = [
      {
        field: "status",
        value: submissionStatusKenum.APPROVED.index,
      },
    ];

    if (after) {
      whereObject.push({
        field: "id",
        operator: "lte",
        value: after,
      });
    }

    // loop through all APPROVED submissions
    const submissions = await Submission.getAllSqlRecord({
      select: ["id", "externalLinks"],
      where: [
        {
          field: "status",
          value: submissionStatusKenum.APPROVED.index,
        },
      ],
      orderBy: [
        {
          field: "id",
          desc: true,
        },
      ],
    });

    // for each, replace the externalLinks and update
    for (const submission of submissions) {
      let changed = false;
      const finalExternalLinks = submission.externalLinks.map((link) => {
        // if link exists, replace it. else use original
        const fileId = linkMap.get(link);

        if (fileId) {
          changed = true;
          return `${env.site.cdn_url}/f/${fileId}`;
        }

        return link;
      });

      // if changed, update
      if (changed) {
        await Submission.updateSqlRecord({
          fields: {
            externalLinks: finalExternalLinks,
          },
          where: [
            {
              field: "id",
              value: submission.id,
            },
          ],
        });
      }
    }
  }

  // goes through all the APPROVED submissions and replaces any externalLink elements that are backed up as a file
  async convertSubmissionExternalLinks(after: string | null) {
    // look up all of the externalBackupLinks
    const externalLinkBackups = await ExternalLinkBackup.getAllSqlRecord({
      select: ["id", "url", "file.id"],
      where: [],
    });

    // create the link -> file.id map
    const linkMap: Map<string, string> = new Map();

    externalLinkBackups.forEach((backup) => {
      linkMap.set(backup.url, backup["file.id"]);
    });

    const whereObject: SqlWhereFieldObject[] = [
      {
        field: "status",
        value: submissionStatusKenum.APPROVED.index,
      },
    ];

    if (after) {
      whereObject.push({
        field: "id",
        operator: "lte",
        value: after,
      });
    }

    // loop through all APPROVED submissions
    const submissions = await Submission.getAllSqlRecord({
      select: ["id", "externalLinks"],
      where: [
        {
          field: "status",
          value: submissionStatusKenum.APPROVED.index,
        },
      ],
      orderBy: [
        {
          field: "id",
          desc: true,
        },
      ],
    });

    // for each, replace the externalLinks and update
    for (const submission of submissions) {
      let changed = false;
      const finalExternalLinks = submission.externalLinks.map((link) => {
        // if link exists, replace it. else use original
        const fileId = linkMap.get(link);

        if (fileId) {
          changed = true;
          return `${env.site.cdn_url}/f/${fileId}`;
        }

        return link;
      });

      // if changed, update
      if (changed) {
        await Submission.updateSqlRecord({
          fields: {
            externalLinks: finalExternalLinks,
          },
          where: [
            {
              field: "id",
              value: submission.id,
            },
          ],
        });
      }
    }
  }

  // goes through all the APPROVED submissions, finds any images and backs them up
  async backupAllSubmissionEvidence(req: Request, after: string | null) {
    const whereObject: SqlWhereFieldObject[] = [
      {
        field: "status",
        value: submissionStatusKenum.APPROVED.index,
      },
    ];

    if (after) {
      whereObject.push({
        field: "id",
        operator: "lte",
        value: after,
      });
    }

    const submissions = await Submission.getAllSqlRecord({
      select: ["id", "externalLinks"],
      where: whereObject,
      orderBy: [
        {
          field: "id",
          desc: true,
        },
      ],
    });

    for (const submission of submissions) {
      await ExternalLinkBackup.backupExternalLinks(
        submission.id,
        req.user!.id,
        submission.externalLinks
      ).catch(() => {
        console.log(`Failed at submission.id: ${submission.id}`);
      });

      if (isTimeoutImminent(req)) {
        throw new TimeoutError({
          message: `${submission.id}`,
        });
      }
    }
  }

  // syncs the isRelevantRecord for all events
  async syncAllIsRelevantRecord() {
    // get all events
    const events = await Event.getAllSqlRecord({
      select: ["id"],
      where: {},
    });

    // for each event, reset all isRecord flags, look up all submissions
    for (const event of events) {
      // get all valid # of participants for the event
      const submissionParticipants = await Submission.getAllSqlRecord({
        select: ["participants"],
        distinctOn: ["participants"],
        where: {
          event: event.id,
        },
      });

      const distinctParticipantsCounts = submissionParticipants.map(
        (ele) => ele.participants
      );

      for (const participantsCount of distinctParticipantsCounts) {
        await Submission.syncIsRelevantRecord(event.id, participantsCount);
      }
    }
  }

  async syncIsSoloPersonalBest() {
    const submissions = await Submission.getAllSqlRecord({
      select: ["id", "event.id", "participantsList"],
      where: {
        participants: 1,
      },
    });

    // map of eventId+characterId -> submissionId
    const submissionIdMap: Map<
      string,
      {
        submissionId: string;
        eventId: string;
      }
    > = new Map();

    submissions.forEach((submission) => {
      submissionIdMap.set(
        `${submission["event.id"]}-${submission.participantsList[0].characterId}`,
        {
          submissionId: submission.id,
          eventId: submission["event.id"],
        }
      );
    });

    // for each submissionId in the map, run syncSoloPBState
    for (const [key, submission] of submissionIdMap) {
      await Submission.syncSoloPBState(
        submission.submissionId,
        submission.eventId
      );
    }
  }

  async fetchAllLinksFromChannel(channelId: string) {
    const allLinksSet = new Set();

    let lastMessageId = null;
    let isFirstIteration = true;

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    while (isFirstIteration || lastMessageId !== null) {
      const data = await sendDiscordRequest(
        "get",
        `/channels/${channelId}/messages`,
        lastMessageId
          ? {
              before: lastMessageId,
            }
          : null
      );

      data.forEach((message) => {
        // get urls from content
        if (message.content) {
          const urlsMatch = message.content.match(/https:\/\/[^\s]*/g);
          if (urlsMatch) urlsMatch.forEach((url) => allLinksSet.add(url));
        }

        // get urls from embeds
        if (message.embeds) {
          message.embeds.forEach((embed) => {
            allLinksSet.add(embed.thumbnail.url);
          });
        }
      });

      // if no results returned, set lastMessageId to null
      if (data.length < 1) {
        lastMessageId = null;
      } else {
        // else set it to the id of the last item returned
        lastMessageId = data[data.length - 1].id;
      }

      isFirstIteration = false;

      // need to wait 1000ms to prevent rate limiting
      await sleep(1000);
    }

    return allLinksSet;
  }

  async syncEvidenceKey() {
    // go through all submissions and sync evidenceKey field based on externalLinks
    const submissions = await Submission.getAllSqlRecord({
      select: ["id", "externalLinks"],
      where: {},
    });

    for (const submission of submissions) {
      const evidenceKey = submission.externalLinks[0] ?? null;

      if (evidenceKey) {
        await Submission.updateSqlRecord({
          fields: {
            evidenceKey,
          },
          where: {
            id: submission.id,
          },
        });
      }
    }
  }

  async syncEventEra() {
    // go through all submissions and confirm if happenedOn corresponds to the eventEra beginDate and endDate. if not, correct it
    const submissions = await Submission.getAllSqlRecord({
      select: [
        "id",
        "event.id",
        "eventEra.beginDate",
        "eventEra.endDate",
        "happenedOn",
      ],
      where: {},
    });

    const submissionsToCorrect: any[] = [];

    for (const submission of submissions) {
      if (submission.happenedOn < submission["eventEra.beginDate"]) {
        submissionsToCorrect.push(submission);
      }

      if (
        submission["eventEra.endDate"] &&
        submission.happenedOn > submission["eventEra.endDate"]
      ) {
        submissionsToCorrect.push(submission);
      }
    }

    for (const submission of submissionsToCorrect) {
      const eventEras = await EventEra.getAllSqlRecord({
        select: ["id", "beginDate", "endDate"],
        where: {
          event: submission["event.id"],
        },
      });

      const matchingEventEra = eventEras.find((eventEra) => {
        return (
          submission.happenedOn >= eventEra.beginDate &&
          (eventEra.endDate === null ||
            submission.happenedOn <= eventEra.endDate)
        );
      });

      if (!matchingEventEra) {
        throw new Error("no matching event era for " + submission.id);
      }

      await Submission.updateSqlRecord({
        fields: {
          eventEra: matchingEventEra.id,
        },
        where: {
          id: submission.id,
        },
      });
    }
  }

  async syncHappenedOn() {
    // go through all submissions, sync the happenedOn with the imgur metadata
    const submissions = await Submission.getAllSqlRecord({
      select: ["id", "externalLinks"],
      where: [
        {
          field: "createdAt",
          operator: "lt",
          value: 1641357843,
        },
      ],
    });

    for (const submission of submissions) {
      const firstExternalLink = submission.externalLinks[0];

      if (firstExternalLink) {
        const regexMatch = firstExternalLink.match(
          /https:\/\/i.imgur.com\/(.*?)\..*/
        );

        if (regexMatch) {
          const { data } = await prodResource.get("/image/" + regexMatch[1], {
            headers: {
              Authorization: "Client-ID " + env.imgur.client_id,
            },
          });

          await Submission.updateSqlRecord({
            fields: {
              happenedOn: data.data.datetime,
            },
            where: {
              id: submission.id,
            },
          });
        }
      }
    }
  }
}
