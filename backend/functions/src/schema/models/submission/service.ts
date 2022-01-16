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
  SqlWhereFieldObject,
  SqlWhereObject,
  updateTableRow,
} from "../../core/helpers/sql";
import { eventEraModeKenum, submissionStatusKenum } from "../../enums";
import {
  DiscordChannel,
  DiscordChannelOutput,
  Event,
  EventEra,
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
    - Only allow creation of submission if the status is empty or "SUBMITTED"
    - AND if isRecordingVerified is false or not specified
    */
    create: ({ args }) => {
      if (args.status && args.status !== "SUBMITTED") return false;

      if ("isRecordingVerified" in args && args.isRecordingVerified !== false)
        return false;

      if (!args.status || args.status === "SUBMITTED") return true;
      return true;
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

  async validateEvidenceKeyConstraint(
    evidenceKey: string | null,
    eventId: string,
    fieldPath: string[]
  ) {
    // if no evidenceKey, pass
    if (!evidenceKey) return;

    const count = await this.getRecordCount(
      {
        fields: [
          {
            field: "evidenceKey",
            value: evidenceKey,
          },
          {
            field: "event",
            value: eventId,
          },
          {
            field: "status",
            value: submissionStatusKenum.APPROVED.index,
          },
        ],
      },
      fieldPath
    );

    if (count) {
      throw new GiraffeqlBaseError({
        message: `An existing approved submission with this evidenceKey-event combination already exists`,
        fieldPath,
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

    const inferredStatus = args.status
      ? submissionStatusKenum.fromUnknown(args.status)
      : submissionStatusKenum.SUBMITTED;

    const evidenceKey =
      (validatedArgs.externalLinks ? validatedArgs.externalLinks[0] : null) ??
      null;

    // changed: if adding as APPROVED and at least 1 externalLink provided, use the first link as the evidenceKey
    if (inferredStatus === submissionStatusKenum.APPROVED) {
      // check it against the existing evidenceKeys for approved submissions
      await this.validateEvidenceKeyConstraint(
        evidenceKey,
        validatedArgs.event,
        fieldPath
      );
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

    // changed: check if happenedOn is between beginDate and endDate for eventEra
    const eventEraRecord = await EventEra.lookupRecord(
      ["beginDate", "endDate"],
      { id: validatedArgs.eventEra },
      fieldPath
    );

    if (validatedArgs.happenedOn < eventEraRecord.beginDate) {
      throw new GiraffeqlBaseError({
        message: `HappenedOn cannot be before the eventEra's begin date`,
        fieldPath,
      });
    }

    if (
      eventEraRecord.endDate &&
      validatedArgs.happenedOn > eventEraRecord.endDate
    ) {
      throw new GiraffeqlBaseError({
        message: `HappenedOn cannot be after the eventEra's end date`,
        fieldPath,
      });
    }

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(fieldPath),
        ...validatedArgs,
        participants: validatedArgs.participantsList.length, // computed
        evidenceKey: evidenceKey, // computed
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

    // if the record was added as approved, also need to run syncSubmissionIsRecord
    // HOWEVER, will NOT be triggering handleNewApprovedSubmission and handleRankingChange. admin can flick the status if they want to trigger these events
    if (inferredStatus === submissionStatusKenum.APPROVED) {
      await this.syncSubmissionIsRecord(
        args.event,
        args.participantsList.length,
        args.eventEra
      );
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

      // also, if the record was added as NOT approved, also need to DM the discordId, if any
      if (args.discordId) {
        const foundDiscordUserId = await getGuildMemberId(
          channelMap.guildId,
          args.discordId
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
        "eventEra.id",
        "score",
        "status",
        "discordMessageId",
        "externalLinks",
        "discordId",
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

    const inferredExternalLinks =
      validatedArgs.fields.externalLinks ?? item.externalLinks;

    const evidenceKey = inferredExternalLinks[0] ?? null;

    // changed: if status is being updated from !APPROVED to APPROVED, need to validate the evidenceKey
    if (validatedArgs.fields.status) {
      const previousStatus = submissionStatusKenum.fromUnknown(item.status);

      const newStatus = submissionStatusKenum.fromUnknown(
        validatedArgs.fields.status
      );

      if (
        previousStatus !== submissionStatusKenum.APPROVED &&
        newStatus === submissionStatusKenum.APPROVED
      ) {
        // check it against the existing evidenceKeys for approved submissions
        await this.validateEvidenceKeyConstraint(
          evidenceKey,
          item["event.id"],
          fieldPath
        );
      }
    }

    // convert any lookup/joined fields into IDs
    await this.handleLookupArgs(validatedArgs.fields, fieldPath);

    await updateObjectType({
      typename: this.typename,
      id: item.id,
      updateFields: {
        ...validatedArgs.fields,
        score: validatedArgs.fields.timeElapsed ?? undefined,
        evidenceKey: validatedArgs.fields.externalLinks
          ? validatedArgs.fields.externalLinks[0]
          : undefined, // computed
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
      // this is the RELEVANT_ERA rank
      const ranking = await this.calculateRank({
        eventId: item["event.id"],
        participants: item.participants,
        eventEraId: null,
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

      // also need to DM the discordId about the status change, if any
      if (item.discordId) {
        const foundDiscordUserId = await getGuildMemberId(
          channelMap.guildId,
          item.discordId
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

  // returns Nth fastest unique score
  async getNthFastestScore({
    n,
    eventId,
    eventEraMode,
    eventEraId,
    participants,
  }: {
    n: number;
    eventId: string;
    eventEraMode: eventEraModeKenum;
    eventEraId: string | null;
    participants: number;
  }) {
    const additionalFilters: SqlWhereFieldObject[] = [];

    if (participants) {
      additionalFilters.push({
        field: "participants",
        operator: "eq",
        value: participants,
      });
    }

    if (eventEraMode === eventEraModeKenum.CURRENT_ERA) {
      additionalFilters.push({
        field: "eventEra.isCurrent",
        operator: "eq",
        value: true,
      });
    } else if (eventEraMode === eventEraModeKenum.RELEVANT_ERAS) {
      additionalFilters.push({
        field: "eventEra.isRelevant",
        operator: "eq",
        value: true,
      });
    } else if (eventEraId) {
      additionalFilters.push({
        field: "eventEra.id",
        operator: "eq",
        value: eventEraId,
      });
    }

    // get the nth fastest score, where n = ranksToShow
    const nthScoreResults = await fetchTableRows({
      select: [
        {
          field: "score",
        },
      ],
      from: this.typename,
      distinctOn: ["score"],
      where: {
        fields: [
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
          ...additionalFilters,
        ],
      },
      orderBy: [
        {
          field: "score",
          desc: false,
        },
      ],
      limit: 1,
      offset: n - 1,
    });

    return nthScoreResults[0]?.score ?? null;
  }

  async getSubmissionCharacters(submissionId: string) {
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
      orderBy: [
        {
          field: "character.name",
          desc: false,
        },
      ],
    });

    return submissionLinks.map((link) => link["character.name"]);
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

    type UpdateLogPostSubmission = {
      submission: any;
      characters: string[];
    };

    type UpdateLogPost = {
      relevantChannelIds: Set<string>;
      currentSubmission: UpdateLogPostSubmission;
      ranking: number;
      isTie: boolean;
      isNewWR: boolean;
      secondPlaceSubmissions: UpdateLogPostSubmission[] | null;
    };

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
          "isRecordingVerified",
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
        orderBy: [
          {
            field: "character.name",
            desc: false,
          },
        ],
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

      const updateLogPost: UpdateLogPost = {
        relevantChannelIds: new Set(
          discordChannelOutputs.map(
            (output) => output["discordChannel.channelId"]
          )
        ),
        currentSubmission: {
          submission,
          characters: submissionLinks.map((link) => link["character.name"]),
        },
        isTie: false,
        ranking,
        isNewWR: false,
        secondPlaceSubmissions: null,
      };

      if (ranking === 1) {
        // check if it was a WR tie (more than one other approved submission in relevant era with same score)
        const sameScoreCount = await this.getRecordCount(
          {
            fields: [
              {
                field: "score",
                operator: "eq",
                value: submission.score,
              },
              {
                field: "event.id",
                operator: "eq",
                value: submission["event.id"],
              },
              {
                field: "status",
                operator: "eq",
                value: submissionStatusKenum.APPROVED.index,
              },
              {
                field: "eventEra.isRelevant",
                operator: "eq",
                value: true,
              },
              {
                field: "participants",
                operator: "eq",
                value: submission.participants,
              },
            ],
          },
          fieldPath
        );

        // it is a tie
        if (sameScoreCount > 1) {
          updateLogPost.isTie = true;
        }
      }

      if (ranking === 1 && !updateLogPost.isTie) {
        updateLogPost.isNewWR = true;
        updateLogPost.secondPlaceSubmissions = [];
        // get current 2nd place submission(s)
        const secondPlaceScore = await this.getNthFastestScore({
          n: 2,
          eventId: submission["event.id"],
          eventEraMode: eventEraModeKenum.RELEVANT_ERAS,
          eventEraId: submission["eventEra.id"],
          participants: submission.participants,
        });

        if (secondPlaceScore) {
          const secondPlaceSubmissions = await fetchTableRows({
            select: [
              {
                field: "id",
              },
              {
                field: "score",
              },
            ],
            from: this.typename,
            where: {
              fields: [
                {
                  field: "event.id",
                  operator: "eq",
                  value: submission["event.id"],
                },
                {
                  field: "status",
                  operator: "eq",
                  value: submissionStatusKenum.APPROVED.index,
                },
                {
                  field: "score",
                  operator: "eq",
                  value: secondPlaceScore,
                },
                {
                  field: "eventEra.isRelevant",
                  operator: "eq",
                  value: true,
                },
                {
                  field: "participants",
                  operator: "eq",
                  value: submission.participants,
                },
              ],
            },
            orderBy: [
              {
                field: "happenedOn",
                desc: false,
              },
            ],
          });

          for (const currentSubmission of secondPlaceSubmissions) {
            updateLogPost.secondPlaceSubmissions.push({
              submission: currentSubmission,
              characters: await this.getSubmissionCharacters(
                currentSubmission.id
              ),
            });
          }
        }
      }

      let discordMessageContent: string;
      const eventStr = `${
        submission["event.name"]
      } - ${generateParticipantsText(submission.participants)}`;

      // case 1: isNewWR with at least one secondPlaceWR
      if (
        updateLogPost.isNewWR &&
        updateLogPost.secondPlaceSubmissions &&
        updateLogPost.secondPlaceSubmissions.length > 0
      ) {
        discordMessageContent = `${formatUnixTimestamp(
          submission.happenedOn
        )}\n\n${
          updateLogPost.relevantChannelIds.size
            ? [...updateLogPost.relevantChannelIds]
                .map((channelId) => "<#" + channelId + ">")
                .join(" ") + "\n\n"
            : ""
        }🔸 Replaced **${eventStr} WR - ${serializeTime(
          updateLogPost.secondPlaceSubmissions[0].submission.score
        )}** by\n${updateLogPost.secondPlaceSubmissions
          .map(
            (submissionObject) =>
              `\`\`\`diff\n- ${submissionObject.characters.join(", ")}\`\`\``
          )
          .join("\n")}\n🔸 with **${eventStr} WR - ${serializeTime(
          submission.score
        )}** by\n\`\`\`yaml\n+ ${updateLogPost.currentSubmission.characters.join(
          ", "
        )}\`\`\`\n♦️ **Proof** - <${submission.externalLinks[0]}>${
          submission.isRecordingVerified ? "\n*Recording Verified*" : ""
        }`;
      } else {
        discordMessageContent = `${formatUnixTimestamp(
          submission.happenedOn
        )}\n\n${
          updateLogPost.relevantChannelIds.size
            ? [...updateLogPost.relevantChannelIds]
                .map((channelId) => "<#" + channelId + ">")
                .join(" ") + "\n\n"
            : ""
        }🔸 Added **${eventStr} - ${serializeTime(
          submission.score
        )}** by\n\`\`\`fix\n${updateLogPost.currentSubmission.characters.join(
          ", "
        )}\`\`\`\n🔸 ${updateLogPost.isTie ? "as a tie for" : "to"} **${
          updateLogPost.ranking > 1 ? "Top 3 " : ""
        }${eventStr}${
          updateLogPost.ranking === 1 ? " WR" : ""
        }**\n\n♦️ **Proof** - <${submission.externalLinks[0]}>${
          submission.isRecordingVerified ? "\n*Recording Verified*" : ""
        }`;
      }

      await sendDiscordMessage(channelMap.updateLogs, {
        content: discordMessageContent,
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
      [
        "id",
        "status",
        "event.id",
        "eventEra.id",
        "participants",
        "score",
        "discordMessageId",
      ],
      validatedArgs,
      fieldPath
    );

    // this is the RELEVANT_ERA rank
    const ranking = await this.calculateRank({
      eventId: item["event.id"],
      participants: item.participants,
      eventEraId: null,
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

    // edit the discordMessageId to indicate it was deleted
    await updateDiscordMessage(channelMap.subAlerts, item.discordChannelId, {
      content: "Submission deleted",
    });

    return requestedResults;
  }
}
