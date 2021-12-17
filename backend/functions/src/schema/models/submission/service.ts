import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { permissionsCheck } from "../../core/helpers/permissions";
import {
  createObjectType,
  deleteObjectType,
  updateObjectType,
} from "../../core/helpers/resolver";
import { PaginatedService } from "../../core/services";
import {
  sendDiscordMessage,
  channelMap,
  generateSubmissionMessage,
  updateDiscordMessage,
  generateParticipantsText,
} from "../../helpers/discord";
import {
  countTableRows,
  deleteTableRow,
  fetchTableRows,
  updateTableRow,
} from "../../core/helpers/sql";
import { submissionStatusKenum } from "../../enums";
import {
  DiscordChannel,
  DiscordChannelOutput,
  SubmissionCharacterParticipantLink,
} from "../../services";
import {
  formatUnixTimestamp,
  generateCrudRecordInterfaceUrl,
  generateLeaderboardPageOptions,
  serializeTime,
} from "../../helpers/common";
import { objectOnlyHasFields } from "../../core/helpers/shared";
import { GiraffeqlBaseError } from "giraffeql";

export class SubmissionService extends PaginatedService {
  defaultTypename = "submission";

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
    "event.id": {},
    "era.id": {},
    participants: {},
    status: {},
    "submissionCharacterParticipantLink/character.id": {}
  };

  sortFieldsMap = {
    id: {},
    createdAt: {},
    updatedAt: {},
    happenedOn: {},
    score: {},
  };

  searchFieldsMap = {
    name: {},
  };

  accessControl: AccessControlMap = {
    get: () => true,
    getMultiple: () => true,

    /*
    Only allow creation of submission if the status is empty or "SUBMITTED"
    */
    create: ({ args }) => {
      if (!args.status || args.status === "SUBMITTED") return true;
      return false;
    },
  };

  async calculateRank({
    eventId,
    participants,
    eraId,
    status,
    score,
  }: {
    eventId: string;
    participants: number;
    eraId: string;
    status: submissionStatusKenum | null;
    score: number;
  }) {
    // if status is not approved, return null
    if (status !== submissionStatusKenum.APPROVED) {
      return null;
    }

    const resultsCount = await countTableRows({
      from: this.typename,
      where: {
        fields: [
          {
            field: "score",
            operator: "lt",
            value: score,
          },
          {
            field: "event.id",
            operator: "eq",
            value: eventId,
          },
          {
            field: "participants",
            operator: "eq",
            value: participants,
          },
          {
            field: "status",
            operator: "eq",
            value: submissionStatusKenum.APPROVED.index,
          },
          {
            field: "era.id",
            operator: "eq",
            value: eraId,
          },
        ],
      },
    });

    return resultsCount + 1;
  }

  @permissionsCheck("create")
  async createRecord({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // args should be validated already
    const validatedArgs = <any>args;
    await this.handleLookupArgs(args, fieldPath);

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(fieldPath),
        ...validatedArgs,
        score: validatedArgs.timeElapsed,
        createdBy: req.user?.id, // nullable
      },
      req,
      fieldPath,
    });

    // if the record was added as approved, also need to run syncSubmissionIsRecord
    if (
      args.status &&
      submissionStatusKenum.fromUnknown(args.status) ===
        submissionStatusKenum.APPROVED
    ) {
      const ranking = await this.calculateRank({
        eventId: args.event,
        participants: args.participants,
        eraId: args.era,
        status: validatedArgs.status
          ? submissionStatusKenum.fromUnknown(validatedArgs.status)
          : null,
        score: validatedArgs.timeElapsed, // same as score
      });

      await this.handleNewApprovedSubmission({
        submissionId: addResults.id,
        ranking,
        fieldPath,
      });

      await this.syncSubmissionIsRecord(
        args.event,
        args.participants,
        args.era
      );

      await this.handleRankingChange({
        eventId: args.event,
        participants: args.participants,
        eraId: args.era,
        ranking,
        fieldPath,
      });
    }

    // do post-create fn, if any
    await this.afterCreateProcess(
      {
        req,
        fieldPath,
        args,
        query,
        data,
        isAdmin,
      },
      addResults.id
    );

    return this.isEmptyQuery(query)
      ? {}
      : await this.getRecord({
          req,
          args: { id: addResults.id },
          query,
          fieldPath,
          isAdmin,
          data,
        });
  }

  async afterCreateProcess(
    { req, fieldPath, args }: ServiceFunctionInputs,
    itemId: string
  ) {
    const discordMessage = await sendDiscordMessage(
      channelMap.subAlerts,
      generateSubmissionMessage(itemId, submissionStatusKenum.SUBMITTED)
    );

    await updateTableRow({
      fields: {
        discordMessageId: discordMessage.id,
      },
      table: this.typename,
      where: {
        fields: [
          {
            field: "id",
            value: itemId,
          },
        ],
      },
    });

    /*
    return File.updateFileParentKeys(
      req.user!.id,
      this.typename,
      itemId,
      [args.files],
      fieldPath
    );
    */
  }

  @permissionsCheck("update")
  async updateRecord({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // args should be validated already
    const validatedArgs = <any>args;

    const item = await this.lookupRecord(
      [
        "id",
        "event.id",
        "participants",
        "era.id",
        "score",
        "status",
        "discordMessageId",
      ],
      validatedArgs.item,
      fieldPath
    );

    // changed: if more than status is being updated, the status must be !APPROVED
    if (
      !objectOnlyHasFields(validatedArgs.fields, ["status"]) &&
      submissionStatusKenum.fromUnknown(item.status) ===
        submissionStatusKenum.APPROVED
    ) {
      throw new GiraffeqlBaseError({
        message: "Cannot update a submission if it is APPROVED",
        fieldPath,
      });
    }

    // convert any lookup/joined fields into IDs
    await this.handleLookupArgs(validatedArgs.fields, fieldPath);

    await updateObjectType({
      typename: this.typename,
      id: item.id,
      updateFields: {
        ...validatedArgs.fields,
        score: validatedArgs.fields.timeElapsed ?? undefined,
        updatedAt: 1,
      },
      req,
      fieldPath,
    });

    // changed: sync the isRecord state
    await this.syncSubmissionIsRecord(
      item["event.id"],
      item.participants,
      item["era.id"]
    );

    if (validatedArgs.fields.status) {
      const ranking = await this.calculateRank({
        eventId: item["event.id"],
        participants: item.participants,
        eraId: item["era.id"],
        status: submissionStatusKenum.fromUnknown(validatedArgs.fields.status),
        score: item.score,
      });

      const previousStatus = submissionStatusKenum.fromUnknown(item.status);

      const newStatus = submissionStatusKenum.fromUnknown(
        validatedArgs.fields.status
      );

      // if the status changed from APPROVED->!APPROVED, or ANY->APPROVED need to update discord leaderboards
      if (
        (previousStatus === submissionStatusKenum.APPROVED &&
          newStatus !== submissionStatusKenum.APPROVED) ||
        newStatus === submissionStatusKenum.APPROVED
      ) {
        await this.handleRankingChange({
          eventId: item["event.id"],
          participants: item.participants,
          eraId: item["era.id"],
          ranking,
          fieldPath,
        });
      }

      // if the status changed from ANY->APPROVED, need to also possibly send an announcement in update-logs
      await this.handleNewApprovedSubmission({
        submissionId: item.id,
        ranking,
        fieldPath,
      });

      // if the status was updated, also force refresh of the discordMessage, if any
      if (item.discordMessageId) {
        await updateDiscordMessage(
          channelMap.subAlerts,
          item.discordMessageId,
          generateSubmissionMessage(
            item.id,
            submissionStatusKenum.fromUnknown(validatedArgs.fields.status)
          )
        );
      }
    }

    // do post-update fn, if any
    await this.afterUpdateProcess(
      {
        req,
        fieldPath,
        args,
        query,
        data,
        isAdmin,
      },
      item.id
    );

    return this.isEmptyQuery(query)
      ? {}
      : await this.getRecord({
          req,
          args: { id: item.id },
          query,
          fieldPath,
          isAdmin,
          data,
        });
  }

  // this mainly updates any leaderboards necessary
  async handleRankingChange({
    eventId,
    participants,
    eraId,
    ranking,
    fieldPath,
  }: {
    submissionId?: string;
    eventId: string;
    participants: number;
    eraId: string;
    ranking: number | null;
    fieldPath: string[];
  }) {
    if (!ranking) return;

    const discordChannelOutputs = await fetchTableRows({
      select: [
        {
          field: "discordChannel.id",
        },
      ],
      from: DiscordChannelOutput.typename,
      where: {
        fields: [
          {
            field: "event.id",
            operator: "eq",
            value: eventId,
          },
          {
            field: "participants",
            operator: "in",
            value: [null, participants],
          },
          {
            field: "era.id",
            operator: "in",
            value: [null, eraId],
          },
          {
            field: "ranksToShow",
            operator: "gte",
            value: ranking,
          },
        ],
      },
    });

    // if any entries to render, update them
    const discordChannelIds: Set<string> = new Set(
      discordChannelOutputs.map((ele) => ele["discordChannel.id"])
    );

    for (const discordChannelId of discordChannelIds) {
      await DiscordChannel.renderOutput(discordChannelId, fieldPath);
    }
  }

  // this basically will broadcast an update in update-logs channel if it's a new top 3.
  async handleNewApprovedSubmission({
    submissionId,
    ranking,
    fieldPath,
  }: {
    submissionId: string;
    ranking: number | null;
    fieldPath: string[];
  }) {
    if (!ranking) return;
    // if ranking <= 3, send an update in the update-logs channel
    if (submissionId && ranking <= 3) {
      // fetch relevant submission info
      const submission = await this.lookupRecord(
        [
          "event.id",
          "event.name",
          "era.id",
          "participants",
          "score",
          "externalLinks",
          "happenedOn",
        ],
        { id: submissionId },
        fieldPath
      );

      // fetch the participants
      const submissionLinks = await fetchTableRows({
        select: [{ field: "character.name" }],
        from: SubmissionCharacterParticipantLink.typename,
        where: {
          fields: [
            {
              field: "submission",
              operator: "eq",
              value: submissionId,
            },
          ],
        },
      });

      // check which discord channels this record could be a part of
      const discordChannelOutputs = await fetchTableRows({
        select: [
          {
            field: "discordChannel.channelId",
          },
        ],
        from: DiscordChannelOutput.typename,
        where: {
          fields: [
            {
              field: "event.id",
              operator: "eq",
              value: submission["event.id"],
            },
            {
              field: "participants",
              operator: "in",
              value: [null, submission.participants],
            },
            {
              field: "era.id",
              operator: "in",
              value: [null, submission["era.id"]],
            },
            {
              field: "ranksToShow",
              operator: "gte",
              value: ranking,
            },
          ],
        },
      });

      const relevantChannelIds: Set<string> = new Set(
        discordChannelOutputs.map(
          (output) => output["discordChannel.channelId"]
        )
      );

      await sendDiscordMessage(channelMap.updateLogs, {
        content: `${formatUnixTimestamp(submission.happenedOn)}\n\n${
          relevantChannelIds.size
            ? [...relevantChannelIds]
                .map((channelId) => "<#" + channelId + ">")
                .join(" ") + "\n\n"
            : ""
        }🔸 Added ** ${submission["event.name"]} - ${generateParticipantsText(
          submission.participants
        )} - ${serializeTime(
          submission.score
        )}** by\n\`\`\`fix\n${submissionLinks
          .map((link) => link["character.name"])
          .join(", ")}\`\`\`\n🔸 to **Top 3 ${
          submission["event.name"]
        } - ${generateParticipantsText(
          submission.participants
        )}**\n\n♦️ **Proof** - <${submission.externalLinks[0]}>`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: "View Full Leaderboard",
                style: 5,
                url: generateCrudRecordInterfaceUrl(
                  "/leaderboard",
                  generateLeaderboardPageOptions({
                    eventId: submission["event.id"],
                    eraId: submission["era.id"],
                    participants: submission.participants,
                  })
                ),
              },
            ],
          },
        ],

        /*
        embeds: [
          {
            title: `Top 3 Update: ${submission["event.name"]}`,
            url: generateCrudRecordInterfaceUrl(
              "/leaderboard",
              generateLeaderboardPageOptions({
                eventId: submission["event.id"],
                eraId: submission["era.id"],
                participants: submission.participants,
              })
            ),
            description: "Click link to view full leaderboard",
          },
          {
            title: `#${ranking} - ${serializeTime(
              submission.score
            )} - ${submissionLinks
              .map((link) => link["character.name"])
              .join(", ")}`,
            url: `${submission.externalLinks[0]}`,
            color: 15105570,
          },
        ],
        */
      });
    }
  }

  async syncSubmissionIsRecord(
    eventId: string,
    participants: number,
    eraId: string
  ) {
    const [fastestRecord] = await fetchTableRows({
      select: [{ field: "id" }],
      from: this.typename,
      where: {
        fields: [
          {
            field: "event.id",
            operator: "eq",
            value: eventId,
          },
          {
            field: "participants",
            operator: "eq",
            value: participants,
          },
          {
            field: "status",
            operator: "eq",
            value: submissionStatusKenum.APPROVED.index,
          },
          {
            field: "era.id",
            operator: "eq",
            value: eraId,
          },
        ],
      },
      orderBy: [
        {
          field: "score",
          desc: false,
        },
      ],
      limit: 1,
    });

    if (!fastestRecord) {
      return;
    }

    // set the fastest record isRecord to true
    await updateTableRow({
      fields: {
        isRecord: true,
      },
      table: this.typename,
      where: {
        fields: [
          {
            field: "id",
            operator: "eq",
            value: fastestRecord.id,
          },
        ],
      },
    });
  }

  async afterUpdateProcess(
    { req, fieldPath, args }: ServiceFunctionInputs,
    itemId: string
  ) {
    /*
    return File.updateFileParentKeys(
      req.user!.id,
      this.typename,
      itemId,
      [args.fields.files],
      fieldPath
    );
    */
  }

  @permissionsCheck("delete")
  async deleteRecord({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // args should be validated already
    const validatedArgs = <any>args;
    // confirm existence of item and get ID
    const item = await this.lookupRecord(
      ["id", "status", "event.id", "era.id", "participants", "score"],
      validatedArgs,
      fieldPath
    );

    const ranking = await this.calculateRank({
      eventId: item["event.id"],
      participants: item.participants,
      eraId: item["era.id"],
      status: submissionStatusKenum.fromUnknown(item.status),
      score: item.score,
    });

    // first, fetch the requested query, if any
    const requestedResults = this.isEmptyQuery(query)
      ? {}
      : await this.getRecord({
          req,
          args,
          query,
          fieldPath,
          isAdmin,
          data,
        });

    await deleteObjectType({
      typename: this.typename,
      id: item.id,
      req,
      fieldPath,
    });

    // changed: also need to delete related links
    await deleteTableRow({
      table: SubmissionCharacterParticipantLink.typename,
      where: {
        fields: [
          {
            field: "submission",
            value: item.id,
          },
        ],
      },
    });

    // if the status was APPROVED on the deleted record, need to refresh any discordChannelOutput that had this record in it
    if (
      submissionStatusKenum.fromUnknown(item.status) ===
      submissionStatusKenum.APPROVED
    ) {
      await this.handleRankingChange({
        eventId: item["event.id"],
        participants: item.participants,
        eraId: item["era.id"],
        ranking,
        fieldPath,
      });
    }

    return requestedResults;
  }
}
