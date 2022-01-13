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
  getGuildMemberId,
  createDMChannel,
  generateSubmissionDM,
} from "../../helpers/discord";
import {
  countTableRows,
  deleteTableRow,
  fetchTableRows,
  SqlSelectQuery,
  SqlWhereObject,
  updateTableRow,
} from "../../core/helpers/sql";
import { eventEraModeKenum, submissionStatusKenum } from "../../enums";
import {
  DiscordChannel,
  DiscordChannelOutput,
  Event,
  SubmissionCharacterParticipantLink,
} from "../../services";
import {
  formatUnixTimestamp,
  generateLeaderboardRoute,
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
    "eventEra.id": {},
    "eventEra.isRelevant": {},
    participants: {},
    status: {},
    "submissionCharacterParticipantLink/character.id": {},
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
    eventEraId,
    isRelevantEventEra = null,
    status,
    score,
  }: {
    eventId: string;
    participants: number | null;
    eventEraId: string | null;
    isRelevantEventEra?: boolean | null;
    status: submissionStatusKenum | null;
    score: number;
  }) {
    // if status is not approved, return null
    if (status !== submissionStatusKenum.APPROVED) {
      return null;
    }

    const whereObject: SqlWhereObject = {
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
          field: "status",
          operator: "eq",
          value: submissionStatusKenum.APPROVED.index,
        },
      ],
    };

    if (participants) {
      whereObject.fields.push({
        field: "participants",
        operator: "eq",
        value: participants,
      });
    }

    if (eventEraId) {
      whereObject.fields.push({
        field: "eventEra.id",
        operator: "eq",
        value: eventEraId,
      });
    }

    if (isRelevantEventEra !== null) {
      whereObject.fields.push({
        field: "eventEra.isRelevant",
        operator: "eq",
        value: isRelevantEventEra,
      });
    }

    const resultsCount = await countTableRows({
      field: "score",
      distinct: true,
      from: this.typename,
      where: whereObject,
    });

    return resultsCount + 1;
  }

  sqlParamsModifier(sqlParams: Omit<SqlSelectQuery, "from" | "select">) {
    // need to add sorting by dateHappened asc to all queries
    if (sqlParams.orderBy) {
      sqlParams.orderBy.push({
        field: "happenedOn",
        desc: false,
      });
    }
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

    // changed: if no participants, reject
    if (validatedArgs.participantsList.length < 1) {
      throw new GiraffeqlBaseError({
        message: "Must have at least 1 participant",
        fieldPath,
      });
    }

    // changed: check if number of participants is between minParticipants and maxParticipants for the event
    const eventRecord = await Event.lookupRecord(
      ["minParticipants", "maxParticipants"],
      { id: validatedArgs.event },
      fieldPath
    );

    if (
      eventRecord.minParticipants &&
      validatedArgs.participantsList.length < eventRecord.minParticipants
    ) {
      throw new GiraffeqlBaseError({
        message: `This event requires at least ${eventRecord.minParticipants} participants`,
        fieldPath,
      });
    }

    if (
      eventRecord.maxParticipants &&
      validatedArgs.participantsList.length > eventRecord.maxParticipants
    ) {
      throw new GiraffeqlBaseError({
        message: `This event requires at most ${eventRecord.maxParticipants} participants`,
        fieldPath,
      });
    }

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(fieldPath),
        ...validatedArgs,
        participants: validatedArgs.participantsList.length, // computed
        score: validatedArgs.timeElapsed,
        createdBy: req.user?.id, // nullable
      },
      req,
      fieldPath,
    });

    // changed: also need to add the submissionCharacterParticipantLinks
    for (const participant of validatedArgs.participantsList) {
      await createObjectType({
        typename: SubmissionCharacterParticipantLink.typename,
        addFields: {
          id: await SubmissionCharacterParticipantLink.generateRecordId(
            fieldPath
          ),
          submission: addResults.id,
          character: participant.characterId,
          title: null,
          createdBy: req.user?.id, // nullable
        },
        req,
        fieldPath,
      });
    }

    const inferredStatus = args.status
      ? submissionStatusKenum.fromUnknown(args.status)
      : submissionStatusKenum.SUBMITTED;

    // if the record was added as approved, also need to run syncSubmissionIsRecord
    // HOWEVER, will NOT be triggering handleNewApprovedSubmission and handleRankingChange. admin can flick the status if they want to trigger these events
    if (inferredStatus === submissionStatusKenum.APPROVED) {
      await this.syncSubmissionIsRecord(
        args.event,
        args.participantsList.length,
        args.eventEra
      );

      /*
      const ranking = await this.calculateRank({
        eventId: args.event,
        participants: args.participants,
        eventEraId: args.eventEra,
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
      await this.handleRankingChange({
        eventId: args.event,
        participants: args.participants,
        eventEraId: args.eventEra,
        ranking,
        fieldPath,
      });
      */
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
    const inferredStatus = args.status
      ? submissionStatusKenum.fromUnknown(args.status)
      : submissionStatusKenum.SUBMITTED;

    // send the message in the sub-alerts channel only if NOT added as approved.
    if (inferredStatus !== submissionStatusKenum.APPROVED) {
      const discordMessage = await sendDiscordMessage(
        channelMap.subAlerts,
        generateSubmissionMessage(itemId, inferredStatus)
      );

      // also, if the record was added as NOT approved, also need to DM the discordId on the first team member entry, if any
      const firstParticipantDiscordId = args.participantsList[0].discordId;

      if (firstParticipantDiscordId) {
        const foundDiscordUserId = await getGuildMemberId(
          channelMap.guildId,
          firstParticipantDiscordId
        );

        if (foundDiscordUserId) {
          const dmChannelId = await createDMChannel(foundDiscordUserId);

          await sendDiscordMessage(
            dmChannelId,
            generateSubmissionDM(itemId, inferredStatus)
          );
        }
      }

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
    }

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
        "participantsList",
        "eventEra.id",
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
      item["eventEra.id"]
    );

    if (validatedArgs.fields.status) {
      const ranking = await this.calculateRank({
        eventId: item["event.id"],
        participants: item.participants,
        eventEraId: item["eventEra.id"],
        isRelevantEventEra: true,
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
          eventEraId: item["eventEra.id"],
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

      // also need to DM the discordId on the first team member entry about the status change, if any
      const firstParticipantDiscordId = item.participantsList[0].discordId;

      if (firstParticipantDiscordId) {
        const foundDiscordUserId = await getGuildMemberId(
          channelMap.guildId,
          firstParticipantDiscordId
        );

        if (foundDiscordUserId) {
          const dmChannelId = await createDMChannel(foundDiscordUserId);

          await sendDiscordMessage(
            dmChannelId,
            generateSubmissionDM(
              item.id,
              submissionStatusKenum.fromUnknown(validatedArgs.fields.status)
            )
          );
        }
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
    eventEraId,
    ranking,
    fieldPath,
  }: {
    submissionId?: string;
    eventId: string;
    participants: number;
    eventEraId: string;
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
            field: "eventEra.id",
            operator: "in",
            value: [null, eventEraId],
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
          "eventEra.id",
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
              field: "eventEra.id",
              operator: "in",
              value: [null, submission["eventEra.id"]],
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
                url: generateLeaderboardRoute({
                  eventId: submission["event.id"], // required
                  eventEraId: submission["eventEra.id"], // required
                  eventEraMode: eventEraModeKenum.RELEVANT_ERAS.name,
                  participants: submission.participants, // required
                }),
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
                eventEraId: submission["eventEra.id"],
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
    eventEraId: string
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
            field: "eventEra.id",
            operator: "eq",
            value: eventEraId,
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
      ["id", "status", "event.id", "eventEra.id", "participants", "score"],
      validatedArgs,
      fieldPath
    );

    const ranking = await this.calculateRank({
      eventId: item["event.id"],
      participants: item.participants,
      eventEraId: item["eventEra.id"],
      isRelevantEventEra: true,
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
        eventEraId: item["eventEra.id"],
        ranking,
        fieldPath,
      });
    }

    return requestedResults;
  }
}
