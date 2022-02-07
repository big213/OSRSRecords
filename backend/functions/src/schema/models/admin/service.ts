import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { BaseService } from "../../core/services";
import axios from "axios";
import { permissionsCheck } from "../../core/helpers/permissions";
import { env } from "../../../config";
import { Event, EventEra, Submission } from "../../services";
import { fetchTableRows, updateTableRow } from "../../core/helpers/sql";
import { sendDiscordRequest } from "../../helpers/discord";
import * as fs from "fs";
import { submissionStatusKenum } from "../../enums";

const prodResource = axios.create({
  baseURL: "https://api.imgur.com/3",
});

export class AdminService extends BaseService {
  accessControl: AccessControlMap = {
    image: () => true,
  };

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

    await this.syncAllIsRelevantRecord();

    return "done";
  }

  // syncs the isRelevantRecord for all events
  async syncAllIsRelevantRecord() {
    // get all events
    const events = await fetchTableRows({
      select: [
        {
          field: "id",
        },
      ],
      from: Event.typename,
      where: {
        fields: [],
      },
    });

    // for each event, reset all isRecord flags, look up all submissions
    for (const event of events) {
      // get all valid # of participants for the event
      const submissionParticipants = await fetchTableRows({
        select: [
          {
            field: "participants",
          },
        ],
        from: Submission.typename,
        distinctOn: ["participants"],
        where: {
          fields: [
            {
              field: "event",
              value: event.id,
            },
          ],
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
    const submissions = await Submission.lookupMultipleRecord(
      ["id", "event.id", "participantsList"],
      {
        fields: [
          {
            field: "participants",
            value: 1,
          },
        ],
      },
      []
    );

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
    const submissions = await Submission.lookupMultipleRecord(
      ["id", "externalLinks"],
      {
        fields: [],
      },
      []
    );

    for (const submission of submissions) {
      const evidenceKey = submission.externalLinks[0] ?? null;

      if (evidenceKey) {
        await updateTableRow({
          fields: {
            evidenceKey,
          },
          table: Submission.typename,
          where: {
            fields: [
              {
                field: "id",
                value: submission.id,
              },
            ],
          },
        });
      }
    }
  }

  async syncEventEra() {
    // go through all submissions and confirm if happenedOn corresponds to the eventEra beginDate and endDate. if not, correct it
    const submissions = await Submission.lookupMultipleRecord(
      [
        "id",
        "event.id",
        "eventEra.beginDate",
        "eventEra.endDate",
        "happenedOn",
      ],
      {
        fields: [],
      },
      []
    );

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
      const eventEras = await EventEra.lookupMultipleRecord(
        ["id", "beginDate", "endDate"],
        {
          fields: [
            {
              field: "event",
              value: submission["event.id"],
            },
          ],
        },
        []
      );

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

      await updateTableRow({
        fields: {
          eventEra: matchingEventEra.id,
        },
        table: Submission.typename,
        where: {
          fields: [
            {
              field: "id",
              value: submission.id,
            },
          ],
        },
      });
    }
  }

  async syncHappenedOn() {
    // go through all submissions, sync the happenedOn with the imgur metadata
    const submissions = await Submission.lookupMultipleRecord(
      ["id", "externalLinks"],
      {
        fields: [
          {
            field: "createdAt",
            operator: "lt",
            value: 1641357843,
          },
        ],
      },
      []
    );

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

          await updateTableRow({
            fields: {
              happenedOn: data.data.datetime,
            },
            table: Submission.typename,
            where: {
              fields: [
                {
                  field: "id",
                  value: submission.id,
                },
              ],
            },
          });
        }
      }
    }
  }
}
