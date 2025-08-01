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
  updateDiscordMessage,
  getGuildMemberId,
  createDMChannel,
  generateViewSubmissionButtonComponent,
  generateSubmissionStatusDropdownComponent,
  submissionStatusMap,
  crosspostDiscordMessage,
  discordUserIdMap,
  generateEventText,
} from "../../helpers/discord";
import { SqlWhereFieldObject, SqlWhereObject } from "../../core/helpers/sql";
import { eventEraModeKenum, submissionStatusKenum } from "../../enums";
import {
  DiscordChannel,
  DiscordChannelOutput,
  Event,
  EventEra,
  ExternalLinkBackup,
  SubmissionCharacterParticipantLink,
} from "../../services";
import {
  generateLeaderboardRoute,
  isVideoUrl,
  serializeTime,
} from "../../helpers/common";
import { objectOnlyHasFields } from "../../core/helpers/shared";
import { GiraffeqlBaseError } from "giraffeql";
import { env } from "../../../config";
import { knex } from "../../../utils/knex";
import { Transaction } from "knex";

type UpdateLogPostSubmission = {
  submission: any;
  characters: string[];
};

type RelevantErasUpdateLogPost = {
  currentSubmission: UpdateLogPostSubmission;
  ranksToShow: number | null;
  isFastestCompletion: boolean;
  relevantChannelIds: Set<string>;
  ranking: number | null;
  isWR:
    | false
    | {
        isTie:
          | false
          | {
              matchingScores: number; // number of submissions with same score
            };
      };
  secondPlaceSubmissions: UpdateLogPostSubmission[] | null;
};

type SoloPBUpdateLogPost = {
  currentSubmission: UpdateLogPostSubmission;
  currentUserSecondPlaceSubmission: {
    ranking: number;
    score: number;
  } | null;
  kickedSubmissions:
    | null
    | {
        characters: string[];
        score: number;
      }[];
  ranksToShow: number | null;
  relevantChannelIds: Set<string>;
  ranking: number | null;
  isWR: boolean;
  isTie:
    | false
    | {
        matchingScores: number;
      };
};

export class SubmissionService extends PaginatedService {
  defaultTypename = "submission";

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
    "event.id": {},
    "eventEra.id": {},
    "eventEra.isRelevant": {},
    isSoloPersonalBest: {},
    isRelevantRecord: {},
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
    - AND if reviewerComments is not null or not specified
    */
    create: ({ args }) => {
      if (args.status && args.status !== "SUBMITTED") return false;

      if ("isRecordingVerified" in args && args.isRecordingVerified !== false)
        return false;

      if ("reviewerComments" in args && args.reviewerComments !== null) {
        return false;
      }

      if (!args.status || args.status === "SUBMITTED") return true;
      return true;
    },
  };

  async calculateRank({
    eventId,
    participants,
    eventEraId,
    isRelevantEventEra = null,
    isSoloPersonalBest = null,
    characterId = null,
    status,
    score,
    transaction,
  }: {
    eventId: string;
    participants: number | null;
    eventEraId: string | null;
    isRelevantEventEra?: boolean | null;
    isSoloPersonalBest?: boolean | null;
    characterId?: string | null;
    status: submissionStatusKenum | null;
    score: number;
    transaction?: Transaction;
  }) {
    // if status is not approved, return null
    if (status !== submissionStatusKenum.APPROVED) {
      return null;
    }

    if (isSoloPersonalBest === true && participants !== 1) return null;

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

    if (isSoloPersonalBest !== null) {
      whereObject.fields.push({
        field: "isSoloPersonalBest",
        operator: "eq",
        value: isSoloPersonalBest,
      });
    }

    if (characterId) {
      whereObject.fields.push({
        field: "submissionCharacterParticipantLink/character.id",
        operator: "eq",
        value: characterId,
      });
    }

    const resultsCount = await this.countSqlRecord({
      field: "score",
      distinct: true,
      where: [whereObject],
      transaction,
    });

    return resultsCount + 1;
  }

  async validateEvidenceKeyConstraint(
    evidenceKey: string | null,
    eventId: string,
    fieldPath: string[],
    transaction?: Transaction
  ) {
    // if no evidenceKey, pass
    if (!evidenceKey) return;

    const count = await this.countSqlRecord(
      {
        where: {
          // always replace .gifv with .gif for the evidence key
          evidenceKey: evidenceKey.replace(".gifv", ".gif"),
          event: eventId,
          status: submissionStatusKenum.APPROVED.index,
        },
        transaction,
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

  // goes through all submissions that are info requested, submitted, or under review and returns the count. also sends an update in discord subAlerts channel.
  async checkSubmissions({
    req,
    fieldPath,
    args,
    query,
    isAdmin = false,
  }: ServiceFunctionInputs) {
    const recordsCount = await this.countSqlRecord({
      where: [
        {
          field: "status",
          operator: "in",
          value: [
            submissionStatusKenum.INFORMATION_REQUESTED.index,
            submissionStatusKenum.SUBMITTED.index,
            submissionStatusKenum.UNDER_REVIEW.index,
          ],
        },
      ],
    });

    if (recordsCount > 0) {
      await sendDiscordMessage(channelMap.subAlerts, {
        content: `${recordsCount} submissions - action required`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: "View Submissions",
                style: 5,
                url: `${env.site.base_url}/review-queue`,
              },
            ],
          },
        ],
      });
    }

    return recordsCount;
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

    let addResults;
    await knex.transaction(async (transaction) => {
      // changed: if adding as APPROVED and at least 1 externalLink provided, use the first link as the evidenceKey
      if (inferredStatus === submissionStatusKenum.APPROVED) {
        // check it against the existing evidenceKeys for approved submissions
        await this.validateEvidenceKeyConstraint(
          evidenceKey,
          validatedArgs.event,
          fieldPath,
          transaction
        );
      }

      // changed: check if number of participants is between minParticipants and maxParticipants for the event
      const eventRecord = await Event.getFirstSqlRecord(
        {
          select: ["minParticipants", "maxParticipants"],
          where: { id: validatedArgs.event },
          transaction,
        },
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

      // check if happenedOn is in the future, and if so, throw err
      if (validatedArgs.happenedOn > new Date().getTime() / 1000) {
        throw new GiraffeqlBaseError({
          message: `HappenedOn cannot be in the future`,
          fieldPath,
        });
      }

      // changed: check if happenedOn is between beginDate and endDate for eventEra
      const eventEraRecord = await EventEra.getFirstSqlRecord(
        {
          select: ["beginDate", "endDate", "event.id"],
          where: { id: validatedArgs.eventEra },
          transaction,
        },
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

      // changed: confirm if eventEra.event is same as event
      if (eventEraRecord["event.id"] !== validatedArgs.event) {
        throw new GiraffeqlBaseError({
          message: `eventEra must correspond to the event`,
          fieldPath,
        });
      }

      addResults = await createObjectType({
        typename: this.typename,
        addFields: {
          id: await this.generateRecordId(fieldPath, transaction),
          ...validatedArgs,
          participants: validatedArgs.participantsList.length, // computed
          evidenceKey: evidenceKey, // computed
          score: validatedArgs.timeElapsed,
          createdBy: req.user?.id, // nullable
        },
        req,
        fieldPath,
        transaction,
      });

      // changed: also need to add the submissionCharacterParticipantLinks
      for (const participant of validatedArgs.participantsList) {
        await createObjectType({
          typename: SubmissionCharacterParticipantLink.typename,
          addFields: {
            id: await SubmissionCharacterParticipantLink.generateRecordId(
              fieldPath,
              transaction
            ),
            submission: addResults.id,
            character: participant.characterId,
            title: participant.discordId,
            createdBy: req.user?.id, // nullable
          },
          req,
          fieldPath,
          transaction,
        });
      }

      // if the record was added as approved, also need to run syncSubmissionIsRelevantRecord and syncSoloPBState
      // HOWEVER, will NOT be triggering broadcastUpdateLogs and syncDiscordLeaderboards. admin can flick the status if they want to trigger these events
      if (inferredStatus === submissionStatusKenum.APPROVED) {
        await this.syncIsRelevantRecord(
          args.event,
          args.participantsList.length,
          transaction
        );

        // also need to sync the isSoloPersonalBest state if it is a solo record
        if (validatedArgs.participantsList.length === 1) {
          await this.syncSoloPBState(addResults.id, args.event, transaction);
        }
      }
    });

    // do post-create fn, if any
    // no txn for discord messaging -- if this fails, the above work gets saved.
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
        await this.generateSubAlertsMessage(itemId, inferredStatus)
      );

      // also, if the record was added as NOT approved, also need to DM the discordId, if any
      if (args.discordId) {
        const foundDiscordUserId = await getGuildMemberId(
          channelMap.guildId,
          args.discordId
        );

        if (foundDiscordUserId) {
          try {
            const dmChannelId = await createDMChannel(foundDiscordUserId);

            await sendDiscordMessage(
              dmChannelId,
              await this.generateSubmissionDM(itemId, inferredStatus, true)
            );
          } catch {
            // do nothing, fail silently
          }
        }
      }

      await this.updateSqlRecord({
        fields: {
          discordMessageId: discordMessage.id,
        },
        where: {
          id: itemId,
        },
      });
    }
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

    const item = await this.getFirstSqlRecord(
      {
        select: [
          "id",
          "event.id",
          "participants",
          "eventEra.id",
          "score",
          "status",
          "discordMessageId",
          "externalLinks",
          "discordId",
          "participantsList",
        ],
        where: validatedArgs.item,
      },
      fieldPath
    );

    // set discordId to the updated one (fall back to existing one)
    const discordId = validatedArgs.fields.discordId ?? item.discordId;

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

    const previousStatus = submissionStatusKenum.fromUnknown(item.status);

    const newStatus = validatedArgs.fields.status
      ? submissionStatusKenum.fromUnknown(validatedArgs.fields.status)
      : null;

    const inferredExternalLinks =
      validatedArgs.fields.externalLinks ?? item.externalLinks;

    const evidenceKey = inferredExternalLinks[0] ?? null;

    // convert any lookup/joined fields into IDs
    await this.handleLookupArgs(validatedArgs.fields, fieldPath);

    let relevantEraRanking, soloPBRanking;

    await knex.transaction(async (transaction) => {
      // changed: if status is being updated from !APPROVED to APPROVED, need to validate the evidenceKey
      if (
        previousStatus !== submissionStatusKenum.APPROVED &&
        newStatus === submissionStatusKenum.APPROVED
      ) {
        // check it against the existing evidenceKeys for approved submissions
        await this.validateEvidenceKeyConstraint(
          evidenceKey,
          item["event.id"],
          fieldPath,
          transaction
        );
      }

      // note: currently NOT validating if happenedOn corresponds to eventEra OR if participantsList.length corresponds to event, as this should only be accessible by reviewers who should know what they are doing

      await updateObjectType({
        typename: this.typename,
        id: item.id,
        updateFields: {
          ...validatedArgs.fields,
          participants: validatedArgs.fields.participantsList
            ? validatedArgs.fields.participantsList.length
            : undefined, // computed
          score: validatedArgs.fields.timeElapsed ?? undefined,
          evidenceKey: validatedArgs.fields.externalLinks
            ? validatedArgs.fields.externalLinks[0]
            : undefined, // computed
          updatedAt: 1,
        },
        req,
        fieldPath,
        transaction,
      });

      // changed: if participantsList was changed in any way, need to also delete all submissionParticipantLinks and re-sync them
      if (validatedArgs.fields.participantsList) {
        if (
          JSON.stringify(validatedArgs.fields.participantsList) !==
          JSON.stringify(item.participantsList)
        ) {
          await SubmissionCharacterParticipantLink.deleteSqlRecord({
            where: {
              submission: item.id,
            },
            transaction,
          });

          for (const participant of validatedArgs.fields.participantsList) {
            await createObjectType({
              typename: SubmissionCharacterParticipantLink.typename,
              addFields: {
                id: await SubmissionCharacterParticipantLink.generateRecordId(
                  fieldPath,
                  transaction
                ),
                submission: item.id,
                character: participant.characterId,
                title: participant.discordId,
                createdBy: req.user?.id, // nullable
              },
              req,
              fieldPath,
              transaction,
            });
          }
        }
      }

      // also need to sync the isSoloPersonalBest if it is a solo record
      const isSoloPB =
        item.participants === 1
          ? await this.syncSoloPBState(item.id, item["event.id"], transaction)
          : false;

      if (newStatus) {
        // this is the RELEVANT_ERA rank
        relevantEraRanking = await this.calculateRank({
          eventId: item["event.id"],
          participants: item.participants,
          eventEraId: null,
          isRelevantEventEra: true,
          isSoloPersonalBest: null,
          status: newStatus,
          score: item.score,
          transaction,
        });

        // if this submission was slower or the same as a previous solo PB, then set the soloPBRanking to null
        soloPBRanking = isSoloPB
          ? await this.calculateRank({
              eventId: item["event.id"],
              participants: item.participants,
              eventEraId: null,
              isRelevantEventEra: true,
              isSoloPersonalBest: true,
              status: newStatus,
              score: item.score,
              transaction,
            })
          : null;

        // if the status changed from APPROVED->!APPROVED, or ANY->APPROVED need to update discord leaderboards
        if (
          (previousStatus === submissionStatusKenum.APPROVED &&
            newStatus !== submissionStatusKenum.APPROVED) ||
          newStatus === submissionStatusKenum.APPROVED
        ) {
          // also need to sync the isRelevantRecord state
          await this.syncIsRelevantRecord(
            item["event.id"],
            item.participants,
            transaction
          );
        }

        if (newStatus === submissionStatusKenum.APPROVED) {
          // if the status changed from ANY->APPROVED, need to ensure the externalLinks are backed up
          await ExternalLinkBackup.backupExternalLinks(
            item.id,
            req.user!.id,
            inferredExternalLinks,
            transaction
          );
        }
      }
    });

    // perform stuff outside of transaction -- persist the state even if these fail
    if (newStatus) {
      if (
        (previousStatus === submissionStatusKenum.APPROVED &&
          newStatus !== submissionStatusKenum.APPROVED) ||
        newStatus === submissionStatusKenum.APPROVED
      ) {
        // if the status changed from APPROVED->!APPROVED, or ANY->APPROVED need to update discord leaderboards
        await this.syncDiscordLeaderboards({
          eventId: item["event.id"],
          participants: item.participants,
          eventEraId: item["eventEra.id"],
          relevantEraRanking,
          soloPBRanking,
        });

        // if the status changed from ANY->APPROVED, need to also possibly send an announcement in update-logs
        if (newStatus === submissionStatusKenum.APPROVED) {
          await this.broadcastUpdateLogs({
            submissionId: item.id,
            relevantEraRanking,
            soloPBRanking,
            fieldPath,
          });
        }
      }

      // if the status was updated, also force refresh of the discordMessage, if any
      if (item.discordMessageId) {
        await updateDiscordMessage(
          channelMap.subAlerts,
          item.discordMessageId,
          await this.generateSubAlertsMessage(
            item.id,
            submissionStatusKenum.fromUnknown(validatedArgs.fields.status)
          )
        ).catch((e) => e); // fail silently, if the discordMessageId DNE, for example
      }

      // also need to DM the discordId about the status change, if any
      if (discordId) {
        const foundDiscordUserId = await getGuildMemberId(
          channelMap.guildId,
          discordId
        );

        if (foundDiscordUserId) {
          try {
            const dmChannelId = await createDMChannel(foundDiscordUserId);

            await sendDiscordMessage(
              dmChannelId,
              await this.generateSubmissionDM(
                item.id,
                submissionStatusKenum.fromUnknown(validatedArgs.fields.status),
                false
              )
            );
          } catch {
            // do nothing, fail silently
          }
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

  // syncs any leaderboards that would contain this submission
  // if any leaderboard was updated, also trigger #update-logs message
  // currently only handles the RELEVANT_ERAS and isSoloPersonalBest: true situations
  async syncDiscordLeaderboards({
    eventId,
    participants,
    eventEraId,
    relevantEraRanking,
    soloPBRanking,
    transaction,
  }: {
    eventId: string;
    participants: number;
    eventEraId: string;
    relevantEraRanking: number | null;
    soloPBRanking: number | null;
    transaction?: Transaction;
  }) {
    // discord channels that need to be refreshed
    const discordChannelIds: Set<string> = new Set();

    // see if any discord leaderboards with eventEraMode: "RELEVANT_ERAS" need to be refreshed
    // even if relevantEraRanking is null (due to non-approved submission, most likely), force update of related channels to be safe
    const discordChannelOutputs = await DiscordChannelOutput.getAllSqlRecord({
      select: ["discordChannel.id"],
      where: <any>[
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
        relevantEraRanking
          ? {
              field: "ranksToShow",
              operator: "gte",
              value: relevantEraRanking,
            }
          : null,
        {
          field: "eventEraMode",
          value: eventEraModeKenum.RELEVANT_ERAS.index,
        },
        {
          field: "isSoloPersonalBest",
          value: null,
        },
      ].filter((e) => e),
      transaction,
    });

    discordChannelOutputs.forEach((ele) => {
      discordChannelIds.add(ele["discordChannel.id"]);
    });

    // see if any discord leaderboards with isSoloPersonalBest: true need to be refreshed
    if (participants === 1 && soloPBRanking) {
      const discordChannelOutputs = await DiscordChannelOutput.getAllSqlRecord({
        select: ["discordChannel.id"],
        where: [
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
            value: soloPBRanking,
          },
          {
            field: "eventEraMode",
            value: eventEraModeKenum.RELEVANT_ERAS.index,
          },
          {
            field: "isSoloPersonalBest",
            value: true,
          },
        ],
        transaction,
      });

      discordChannelOutputs.forEach((ele) => {
        discordChannelIds.add(ele["discordChannel.id"]);
      });
    }

    // re-render all discord channels necessary
    for (const discordChannelId of discordChannelIds) {
      await DiscordChannel.renderOutput(discordChannelId, []);
    }
  }

  // returns Nth fastest unique score
  async getNthFastestScore({
    n,
    eventId,
    eventEraMode,
    eventEraId,
    isSoloPersonalBest,
    characterId = null,
    participants,
    transaction,
  }: {
    n: number;
    eventId: string;
    eventEraMode: eventEraModeKenum;
    eventEraId: string | null;
    isSoloPersonalBest: boolean | null;
    characterId?: string | null;
    participants: number;
    transaction?: Transaction;
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

    if (isSoloPersonalBest !== null) {
      additionalFilters.push({
        field: "isSoloPersonalBest",
        operator: "eq",
        value: isSoloPersonalBest,
      });
    }

    if (characterId) {
      additionalFilters.push({
        field: "submissionCharacterParticipantLink/character.id",
        operator: "eq",
        value: characterId,
      });
    }

    // get the nth fastest score, where n = ranksToShow
    const nthScoreResults = await this.getAllSqlRecord({
      select: ["score"],
      distinctOn: ["score"],
      where: [
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
      orderBy: [
        {
          field: "score",
          desc: false,
        },
      ],
      limit: 1,
      offset: n - 1,
      transaction,
    });

    return nthScoreResults[0]?.score ?? null;
  }

  async getSubmissionCharacters(
    submissionId: string,
    transaction?: Transaction
  ) {
    const submissionLinks =
      await SubmissionCharacterParticipantLink.getAllSqlRecord({
        select: ["character.name"],
        where: {
          submission: submissionId,
        },
        orderBy: [
          {
            field: "character.name",
            desc: false,
          },
        ],
        transaction,
      });

    return submissionLinks.map((link) => link["character.name"]);
  }

  // this will broadcast an update in update-logs channel if there were any changes in leaderboards
  async broadcastUpdateLogs({
    submissionId,
    relevantEraRanking,
    soloPBRanking,
    fieldPath,
    transaction,
  }: {
    submissionId: string;
    relevantEraRanking: number | null;
    soloPBRanking: number | null;
    fieldPath: string[];
    transaction?: Transaction;
  }) {
    const discordMessageContents: {
      content: string;
      isSoloPersonalBest: boolean | null;
    }[] = [];

    // fetch relevant submission info
    const submission = await this.getFirstSqlRecord(
      {
        select: [
          "id",
          "event.id",
          "event.name",
          "event.maxParticipants",
          "eventEra.id",
          "participants",
          "score",
          "externalLinks",
          "happenedOn",
          "isRecordingVerified",
        ],
        where: { id: submissionId },
        transaction,
      },
      fieldPath
    );

    const submissionLinks =
      await SubmissionCharacterParticipantLink.getAllSqlRecord({
        select: ["character.name", "character.id"],
        where: {
          submission: submissionId,
        },
        orderBy: [
          {
            field: "character.name",
            desc: false,
          },
        ],
        transaction,
      });

    const relevantErasUpdateLogPost: RelevantErasUpdateLogPost = {
      currentSubmission: {
        submission,
        characters: submissionLinks.map((link) => link["character.name"]),
      },
      ranksToShow: null,
      isFastestCompletion: false,
      relevantChannelIds: new Set(),
      ranking: relevantEraRanking,
      isWR: relevantEraRanking === 1 ? { isTie: false } : false,
      secondPlaceSubmissions: null,
    };

    const firstCharacterId = submissionLinks[0]["character.id"];

    const soloPBUpdateLogPost: SoloPBUpdateLogPost = {
      currentSubmission: {
        submission,
        characters: submissionLinks.map((link) => link["character.name"]),
      },
      currentUserSecondPlaceSubmission: null,
      kickedSubmissions: null,
      ranksToShow: null,
      relevantChannelIds: new Set(),
      ranking: soloPBRanking,
      isWR: soloPBRanking === 1,
      isTie: false,
    };

    // check if this record would appear in any rank style leaderboards. isSoloPersonalBest: true and relevant_eras only
    if (soloPBUpdateLogPost.ranking) {
      const discordChannelOutputs = await DiscordChannelOutput.getAllSqlRecord({
        select: ["ranksToShow", "discordChannel.channelId"],
        where: [
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
            value: soloPBRanking,
          },
          {
            field: "eventEraMode",
            value: eventEraModeKenum.RELEVANT_ERAS.index,
          },
          {
            field: "isSoloPersonalBest",
            value: true,
          },
        ],
        transaction,
      });

      if (discordChannelOutputs.length > 0) {
        soloPBUpdateLogPost.ranksToShow = Math.max(
          ...discordChannelOutputs.map((ele) => ele.ranksToShow)
        );

        soloPBUpdateLogPost.relevantChannelIds = new Set(
          discordChannelOutputs.map(
            (output) => output["discordChannel.channelId"]
          )
        );

        // check if it was a tie (more than one other approved submission in relevant era with same score)
        const sameScoreCount = await this.countSqlRecord(
          {
            where: {
              score: submission.score,
              "event.id": submission["event.id"],
              status: submissionStatusKenum.APPROVED.index,
              "eventEra.isRelevant": true,
              participants: submission.participants,
              isSoloPersonalBest: true,
            },
            transaction,
          },
          fieldPath
        );

        // was it a tie?
        soloPBUpdateLogPost.isTie =
          sameScoreCount > 1 ? { matchingScores: sameScoreCount } : false;

        // get the soloPBRank of the character's previous record (given relevantEra, eventId, participants), if any.
        const charactersSecondFastestScore = await this.getNthFastestScore({
          n: 2,
          eventId: submission["event.id"],
          eventEraId: null,
          eventEraMode: eventEraModeKenum.RELEVANT_ERAS,
          participants: 1,
          isSoloPersonalBest: null,
          characterId: firstCharacterId,
          transaction,
        });

        if (charactersSecondFastestScore) {
          const previousScoreRank = await this.calculateRank({
            eventId: submission["event.id"],
            participants: submission.participants,
            eventEraId: null,
            isRelevantEventEra: true,
            isSoloPersonalBest: true,
            status: submissionStatusKenum.APPROVED,
            score: charactersSecondFastestScore,
            transaction,
          });

          // actual rank is previousScoreRank - 1
          const previousRank = previousScoreRank ? previousScoreRank - 1 : null;

          // if the previous submission's rank would have appeared on a leaderboard, add it to soloPBUpdateLogPost.currentUserSecondPlaceSubmission
          if (previousRank && previousRank <= soloPBUpdateLogPost.ranksToShow) {
            soloPBUpdateLogPost.currentUserSecondPlaceSubmission = {
              ranking: previousRank,
              score: charactersSecondFastestScore,
            };
          }
        }

        if (
          !soloPBUpdateLogPost.currentUserSecondPlaceSubmission &&
          !soloPBUpdateLogPost.isTie
        ) {
          // if it was not an improvement in the leaderboard AND it was not a tie, someone (or multiple people) just got kicked to 11th place. find out who that was, if any
          const nPlusOneHighestScore = await this.getNthFastestScore({
            n: soloPBUpdateLogPost.ranksToShow + 1,
            eventId: submission["event.id"],
            eventEraId: null,
            eventEraMode: eventEraModeKenum.RELEVANT_ERAS,
            participants: 1,
            isSoloPersonalBest: true,
            transaction,
          });

          if (nPlusOneHighestScore) {
            soloPBUpdateLogPost.kickedSubmissions = [];
            // get ids of submissions with this score
            const submissions = await this.getAllSqlRecord({
              select: ["id"],
              where: {
                "event.id": submission["event.id"],
                participants: submission.participants,
                "eventEra.isRelevant": true,
                score: nPlusOneHighestScore,
                isSoloPersonalBest: true,
              },
              orderBy: [
                {
                  field: "happenedOn",
                  desc: true,
                },
              ],
              transaction,
            });

            for (const submission of submissions) {
              soloPBUpdateLogPost.kickedSubmissions.push({
                characters: await this.getSubmissionCharacters(
                  submission.id,
                  transaction
                ),
                score: nPlusOneHighestScore,
              });
            }
          }
        }
      }
    }

    // check if this record would appear in any normal style leaderboards. eventEraMode: relevant_eras only
    if (relevantErasUpdateLogPost.ranking) {
      const discordChannelOutputs = await DiscordChannelOutput.getAllSqlRecord({
        select: ["ranksToShow", "discordChannel.channelId", "participants"],
        where: [
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
            value: relevantEraRanking,
          },
          {
            field: "eventEraMode",
            value: eventEraModeKenum.RELEVANT_ERAS.index,
          },
          {
            field: "isSoloPersonalBest",
            value: null,
          },
        ],
        transaction,
      });

      if (discordChannelOutputs.length > 0) {
        relevantErasUpdateLogPost.ranksToShow = Math.max(
          ...discordChannelOutputs.map((ele) => ele.ranksToShow)
        );

        // if one output and it is for fastest completion, need to adjust the flag
        if (
          discordChannelOutputs.length === 1 &&
          discordChannelOutputs[0].participants === null
        ) {
          relevantErasUpdateLogPost.isFastestCompletion = true;
        }

        relevantErasUpdateLogPost.relevantChannelIds = new Set(
          discordChannelOutputs.map(
            (output) => output["discordChannel.channelId"]
          )
        );

        // only proceed if no update-log message already
        // if update-log message already exists, load in the relevantChannelIds and skip
        if (soloPBUpdateLogPost.relevantChannelIds.size > 0) {
          relevantErasUpdateLogPost.relevantChannelIds.forEach((channelId) => {
            soloPBUpdateLogPost.relevantChannelIds.add(channelId);
          });
        } else {
          if (relevantErasUpdateLogPost.isWR) {
            // check if it was a WR tie (more than one other approved submission in relevant era with same score)
            const sameScoreCount = await this.countSqlRecord(
              {
                where: {
                  score: submission.score,
                  "event.id": submission["event.id"],
                  status: submissionStatusKenum.APPROVED.index,
                  "eventEra.isRelevant": true,
                  participants: submission.participants,
                },
                transaction,
              },
              fieldPath
            );

            // was it a tie of a WR?
            relevantErasUpdateLogPost.isWR.isTie =
              sameScoreCount > 1 ? { matchingScores: sameScoreCount } : false;
          }

          if (relevantErasUpdateLogPost.isWR) {
            relevantErasUpdateLogPost.secondPlaceSubmissions = [];
            // get current 2nd place submission(s)
            const secondPlaceScore = await this.getNthFastestScore({
              n: 2,
              eventId: submission["event.id"],
              eventEraMode: eventEraModeKenum.RELEVANT_ERAS,
              eventEraId: submission["eventEra.id"],
              participants: submission.participants,
              isSoloPersonalBest: null,
              transaction,
            });

            if (secondPlaceScore) {
              const secondPlaceSubmissions = await this.getAllSqlRecord({
                select: ["id", "score", "happenedOn"],
                where: {
                  "event.id": submission["event.id"],
                  status: submissionStatusKenum.APPROVED.index,
                  score: secondPlaceScore,
                  "eventEra.isRelevant": true,
                  participants: submission.participants,
                },
                orderBy: [
                  {
                    field: "happenedOn",
                    desc: false,
                  },
                ],
                transaction,
              });

              for (const currentSubmission of secondPlaceSubmissions) {
                relevantErasUpdateLogPost.secondPlaceSubmissions.push({
                  submission: currentSubmission,
                  characters: await this.getSubmissionCharacters(
                    currentSubmission.id,
                    transaction
                  ),
                });
              }
            }
          }
        }
      }
    }

    // use the first video link, or fall back to first link.
    const proofLink =
      submission.externalLinks.find((link) => isVideoUrl(link)) ??
      submission.externalLinks[0];

    // generate the discord message for soloPBUpdateLogPost
    // case 1: improvement from X -> Y place
    if (soloPBUpdateLogPost.relevantChannelIds.size) {
      const eventStr = generateEventText(
        submission["event.name"],
        submission.participants,
        submission["event.maxParticipants"]
      );
      if (soloPBUpdateLogPost.currentUserSecondPlaceSubmission) {
        discordMessageContents.push({
          content: `<t:${Math.floor(submission.happenedOn)}:D>\n\n${
            soloPBUpdateLogPost.relevantChannelIds.size
              ? [...soloPBUpdateLogPost.relevantChannelIds]
                  .map((channelId) => "<#" + channelId + ">")
                  .join(" ") + "\n\n"
              : ""
          }🔸 Improved **Rank ${
            soloPBUpdateLogPost.currentUserSecondPlaceSubmission.ranking
          } - ${eventStr} ${
            soloPBUpdateLogPost.currentUserSecondPlaceSubmission.ranking === 1
              ? "WR"
              : "PB"
          } - ${serializeTime(
            soloPBUpdateLogPost.currentUserSecondPlaceSubmission.score
          )}** by\n\`\`\`fix\n${soloPBUpdateLogPost.currentSubmission.characters.join(
            ", "
          )}\`\`\`\n🔸 to **Rank ${soloPBUpdateLogPost.ranking} - ${eventStr} ${
            soloPBUpdateLogPost.isWR ? "WR" : "PB"
          } - ${serializeTime(
            submission.score
          )}**\n\n♦️ **Proof** - <${proofLink}>${
            submission.isRecordingVerified ? "\n*Recording Verified*" : ""
          }`,
          isSoloPersonalBest: true,
        });
      } else {
        // case 2: new on leaderboard
        const kickedText =
          soloPBUpdateLogPost.kickedSubmissions &&
          soloPBUpdateLogPost.kickedSubmissions.length > 0
            ? `\n🔸 thus kicking **Rank ${
                soloPBUpdateLogPost.ranksToShow
              } - ${eventStr} ${
                soloPBUpdateLogPost.isWR ? "WR" : "PB"
              } -  ${serializeTime(
                soloPBUpdateLogPost.kickedSubmissions[0].score
              )}** by\n${soloPBUpdateLogPost.kickedSubmissions
                .map(
                  (submissionObject) =>
                    `\`\`\`diff\n- ${submissionObject.characters.join(
                      ", "
                    )}\`\`\``
                )
                .join("\n")}\n🔸 from **Top ${
                soloPBUpdateLogPost.ranksToShow
              } - ${eventStr} Ranking**`
            : "";

        discordMessageContents.push({
          content: `<t:${Math.floor(submission.happenedOn)}:D>\n\n${
            soloPBUpdateLogPost.relevantChannelIds.size
              ? [...soloPBUpdateLogPost.relevantChannelIds]
                  .map((channelId) => "<#" + channelId + ">")
                  .join(" ") + "\n\n"
              : ""
          }🔸 Added new **Rank ${soloPBUpdateLogPost.ranking} - ${eventStr} ${
            soloPBUpdateLogPost.isWR ? "WR" : "PB"
          } - ${serializeTime(
            submission.score
          )}** by\n\`\`\`yaml\n+ ${soloPBUpdateLogPost.currentSubmission.characters.join(
            ", "
          )}\`\`\`${
            kickedText ? kickedText + "\n" : ""
          }\n♦️ **Proof** - <${proofLink}>${
            submission.isRecordingVerified ? "\n*Recording Verified*" : ""
          }`,
          isSoloPersonalBest: true,
        });
      }
    }

    // generate the discord message for relevantErasUpdateLogPost only if there is not already a discord message.
    // case 1: isNewWR with at least one secondPlaceWR
    if (
      relevantErasUpdateLogPost.relevantChannelIds.size &&
      discordMessageContents.length < 1
    ) {
      const eventStr = generateEventText(
        submission["event.name"],
        relevantErasUpdateLogPost.isFastestCompletion
          ? null
          : submission.participants,
        submission["event.maxParticipants"]
      );

      if (
        relevantErasUpdateLogPost.isWR &&
        !relevantErasUpdateLogPost.isWR.isTie &&
        relevantErasUpdateLogPost.secondPlaceSubmissions &&
        relevantErasUpdateLogPost.secondPlaceSubmissions.length > 0
      ) {
        discordMessageContents.push({
          content: `<t:${Math.floor(submission.happenedOn)}:D>\n\n${
            relevantErasUpdateLogPost.relevantChannelIds.size
              ? [...relevantErasUpdateLogPost.relevantChannelIds]
                  .map((channelId) => "<#" + channelId + ">")
                  .join(" ") + "\n\n"
              : ""
          }🔸 Replaced **${eventStr} WR - ${serializeTime(
            relevantErasUpdateLogPost.secondPlaceSubmissions[0].submission.score
          )}** by\n${relevantErasUpdateLogPost.secondPlaceSubmissions
            .map((submissionObject) => {
              const reignDays = Math.floor(
                (submission.happenedOn -
                  submissionObject.submission.happenedOn) /
                  (24 * 60 * 60)
              );
              return `\`\`\`diff\n- ${submissionObject.characters.join(
                ", "
              )} (${reignDays < 1 ? "<1" : reignDays} day reign)\`\`\``;
            })
            .join("\n")}\n🔸 with **${eventStr} WR - ${serializeTime(
            submission.score
          )}** by\n\`\`\`yaml\n+ ${relevantErasUpdateLogPost.currentSubmission.characters.join(
            ", "
          )}\`\`\`\n♦️ **Proof** - <${proofLink}>${
            submission.isRecordingVerified ? "\n*Recording Verified*" : ""
          }`,
          isSoloPersonalBest: null,
        });
      } else {
        // if we end up here, relevantErasUpdateLogPost.isWR will always be either false or { isTie: { matchingScores: n } }

        const isTie =
          relevantErasUpdateLogPost.isWR && relevantErasUpdateLogPost.isWR.isTie
            ? relevantErasUpdateLogPost.isWR.isTie
            : null;

        const matchingScores = isTie?.matchingScores;

        discordMessageContents.push({
          content: `<t:${Math.floor(submission.happenedOn)}:D>\n\n${
            relevantErasUpdateLogPost.relevantChannelIds.size
              ? [...relevantErasUpdateLogPost.relevantChannelIds]
                  .map((channelId) => "<#" + channelId + ">")
                  .join(" ") + "\n\n"
              : ""
          }🔸 Added **${eventStr} - ${serializeTime(
            submission.score
          )}** by\n\`\`\`yaml\n+ ${relevantErasUpdateLogPost.currentSubmission.characters.join(
            ", "
          )}\`\`\`\n🔸 ${
            relevantErasUpdateLogPost.isWR && matchingScores
              ? `as a ${matchingScores}-way tie for`
              : "to"
          } **${
            relevantErasUpdateLogPost.ranking! > 1 ? "Top 3 " : ""
          }${eventStr}${
            relevantErasUpdateLogPost.isWR ? " WR" : ""
          }**\n\n♦️ **Proof** - <${proofLink}>${
            submission.isRecordingVerified ? "\n*Recording Verified*" : ""
          }`,
          isSoloPersonalBest: null,
        });
      }
    }

    // send out the updates
    for (const discordMessageContent of discordMessageContents) {
      const discordMessage = await sendDiscordMessage(channelMap.updateLogs, {
        content: discordMessageContent.content,
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
                  isSoloPersonalBest: discordMessageContent.isSoloPersonalBest,
                }),
              },
            ],
          },
        ],
      });

      // publish each broadcasted message as well
      await crosspostDiscordMessage(channelMap.updateLogs, discordMessage.id);
    }
  }

  // checks to see if this is a user's PB for the event and participants = 1, and syncs the isSoloPersonalBest state
  // returns true if the submission is the new solo PB, false otherwise. undefined if participants > 1
  async syncSoloPBState(
    submissionId: string,
    eventId: string,
    transaction?: Transaction
  ): Promise<boolean | undefined> {
    const submissionLinks =
      await SubmissionCharacterParticipantLink.getAllSqlRecord({
        select: ["character.id"],
        where: {
          submission: submissionId,
        },
        transaction,
      });

    // only need to check for participants = 1
    if (submissionLinks.length !== 1) return;

    const characterId = submissionLinks[0]["character.id"];

    // get fastest approved submission by user given participants = 1 and event
    const [fastestRecord, secondFastestRecord] = await this.getAllSqlRecord({
      select: ["id"],
      where: {
        event: eventId,
        participants: 1,
        status: submissionStatusKenum.APPROVED.index,
        "submissionCharacterParticipantLink/character.id": characterId,
      },
      orderBy: [
        {
          field: "score",
          desc: false,
        },
        {
          field: "happenedOn",
          desc: false,
        },
      ],
      limit: 2,
      transaction,
    });

    if (!fastestRecord) {
      return;
    }

    // set all of the approved records for user, participants = 1, and eventId to false.
    // only need to do this if there's more than 1 submission returned
    if (secondFastestRecord) {
      // need to lookup IDs since it is not possible to do update where "submissionCharacterParticipantLink/character.id"
      const submissions = await this.getAllSqlRecord({
        select: ["id"],
        where: {
          "event.id": eventId,
          participants: 1,
          status: submissionStatusKenum.APPROVED.index,
          "submissionCharacterParticipantLink/character.id": characterId,
        },
        transaction,
      });

      await this.updateSqlRecord({
        fields: {
          isSoloPersonalBest: false,
        },
        where: [
          {
            field: "id",
            operator: "in",
            value: submissions.map((submission) => submission.id),
          },
        ],
        transaction,
      });
    }

    // set the fastest record isSoloPersonalBest to true
    await this.updateSqlRecord({
      fields: {
        isSoloPersonalBest: true,
      },
      where: {
        id: fastestRecord.id,
      },
      transaction,
    });

    return fastestRecord.id === submissionId;
  }

  // generate some text summarizing a submission's reviewer comments only
  async generateSubmissionReviewerCommentsText(submissionId: string) {
    // get submission info
    const [submission] = await this.getAllSqlRecord({
      select: ["id", "reviewerComments"],
      where: {
        id: submissionId,
      },
    });

    if (!submission) return null;

    return submission.reviewerComments
      ? `Reviewer Comments: ${submission.reviewerComments}\n\n**Please DM <@${discordUserIdMap.reviewer}> with any updated information for this submission. Do not respond to this bot, we won't be able to see it.**`
      : null;
  }

  // generate some text summarizing a submission
  async generateSubmissionText(submissionId: string) {
    // get submission info
    const [submission] = await this.getAllSqlRecord({
      select: [
        "id",
        "event.name",
        "event.maxParticipants",
        "participants",
        "score",
        "externalLinks",
        "happenedOn",
        "world",
        "privateComments",
        "publicComments",
        "reviewerComments",
        "discordId",
      ],
      where: {
        id: submissionId,
      },
    });

    if (!submission) return null;

    const characters = await this.getSubmissionCharacters(submissionId);

    let guildMemberId = null;
    if (submission.discordId) {
      guildMemberId = await getGuildMemberId(
        channelMap.guildId,
        submission.discordId
      );
    }

    return `Happened On: <t:${Math.floor(
      submission.happenedOn
    )}:D>\nEvent: ${generateEventText(
      submission["event.name"],
      submission.participants,
      submission["event.maxParticipants"]
    )}\nTime: ${serializeTime(submission.score)}\nTeam Members: (${
      submission.participants
    }) ${characters.join(", ")}\nLinks: ${submission.externalLinks
      .map((link) => "<" + link + ">")
      .join("\n")}\nWorld: ${submission.world ?? "N/A"}\nPrivate Comments: ${
      submission.privateComments ?? "N/A"
    }\nPublic Comments: ${
      submission.publicComments ?? "N/A"
    }\nReviewer Comments: ${
      submission.reviewerComments ?? "N/A"
    }\nDiscord User: ${
      (guildMemberId ? `<@${guildMemberId}>` : "N/A") +
      (submission.discordId ? ` (${submission.discordId})` : "")
    }`;
  }

  async generateSubmissionDM(
    submissionId: string,
    selectedOption: submissionStatusKenum,
    hasDescription: boolean = false
  ) {
    const submissionStatusObject = submissionStatusMap[selectedOption.name];
    return {
      content: null,
      embeds: [
        {
          title: `Submission ID ${submissionId}\nStatus: ${submissionStatusObject.text}`,
          color: submissionStatusObject.colorId,
          ...(hasDescription && {
            description: await this.generateSubmissionText(submissionId),
          }),
          // if selectedOption is REJECTED OR INFORMATION_REQUESTED, also append comments from reviewer, if any
          ...((selectedOption === submissionStatusKenum.REJECTED ||
            selectedOption === submissionStatusKenum.INFORMATION_REQUESTED) && {
            description: await this.generateSubmissionReviewerCommentsText(
              submissionId
            ),
          }),
        },
      ],
      components: [generateViewSubmissionButtonComponent(submissionId, true)],
    };
  }

  async generateSubAlertsMessage(
    submissionId: string,
    selectedOption: submissionStatusKenum
  ) {
    const submissionStatusObject = submissionStatusMap[selectedOption.name];
    return {
      content: null,
      embeds: [
        {
          title: `Submission ID ${submissionId}`,
          description: await this.generateSubmissionText(submissionId),
          color: submissionStatusObject.colorId,
        },
      ],
      components: [
        generateViewSubmissionButtonComponent(submissionId, false),
        generateSubmissionStatusDropdownComponent(submissionId, selectedOption),
      ],
    };
  }

  async syncIsRelevantRecord(
    eventId: string,
    participants: number,
    transaction?: Transaction
  ) {
    // reset all isRecord flags for the event.
    await this.updateSqlRecord({
      fields: {
        isRelevantRecord: false,
      },
      where: {
        event: eventId,
        participants: participants,
      },
      transaction,
    });

    // lookup all approved submissions in relevantEra, sorting by happenedOn
    const submissions = await this.getAllSqlRecord({
      select: ["id", "score"],
      where: {
        event: eventId,
        participants: participants,
        status: submissionStatusKenum.APPROVED.index,
        "eventEra.isRelevant": true,
      },
      orderBy: [
        {
          field: "happenedOn",
          desc: false,
        },
      ],
      transaction,
    });

    // go through each submission and if it is a relevantRecord, flag it
    let currentRecord: number = Infinity;

    for (const submission of submissions) {
      // is it better than the current record? if so, flag it and set that as new record
      if (submission.score < currentRecord) {
        currentRecord = submission.score;
        await this.updateSqlRecord({
          fields: {
            isRelevantRecord: true,
          },
          where: {
            id: submission.id,
          },
          transaction,
        });
      }
    }
  }

  async afterUpdateProcess(
    { req, fieldPath, args }: ServiceFunctionInputs,
    itemId: string
  ) {}

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
    const item = await this.getFirstSqlRecord(
      {
        select: [
          "id",
          "status",
          "event.id",
          "eventEra.id",
          "participants",
          "isRelevantRecord",
          "score",
          "discordMessageId",
        ],
        where: validatedArgs,
      },
      fieldPath
    );

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

    await knex.transaction(async (transaction) => {
      // this is the RELEVANT_ERA rank
      const relevantEraRanking = await this.calculateRank({
        eventId: item["event.id"],
        participants: item.participants,
        eventEraId: null,
        isRelevantEventEra: true,
        isSoloPersonalBest: null,
        status: submissionStatusKenum.fromUnknown(item.status),
        score: item.score,
        transaction,
      });

      const soloPBRanking = await this.calculateRank({
        eventId: item["event.id"],
        participants: item.participants,
        eventEraId: null,
        isRelevantEventEra: true,
        isSoloPersonalBest: true,
        status: submissionStatusKenum.fromUnknown(item.status),
        score: item.score,
        transaction,
      });

      await deleteObjectType({
        typename: this.typename,
        id: item.id,
        req,
        fieldPath,
        transaction,
      });

      // changed: also need to delete related links
      await SubmissionCharacterParticipantLink.deleteSqlRecord({
        where: {
          submission: item.id,
        },
        transaction,
      });

      // if the status was APPROVED on the deleted record, need to sync any leaderboard that contains it
      if (
        submissionStatusKenum.fromUnknown(item.status) ===
        submissionStatusKenum.APPROVED
      ) {
        // if the leaderboard sync fails, rollback
        await this.syncDiscordLeaderboards({
          eventId: item["event.id"],
          participants: item.participants,
          eventEraId: item["eventEra.id"],
          relevantEraRanking,
          soloPBRanking,
          transaction,
        });

        // also need to sync the isSoloPersonalBest state if it is a solo record
        if (item.participants === 1) {
          await this.syncSoloPBState(item.id, item["event.id"], transaction);
        }

        // also need to sync the isRelevantRecord state if it was a relevant record
        if (item.isRelevantRecord) {
          await this.syncIsRelevantRecord(
            item["event.id"],
            item.participants,
            transaction
          );
        }
      }
    });

    // edit the discordMessageId to indicate it was deleted
    await updateDiscordMessage(channelMap.subAlerts, item.discordMessageId, {
      content: "Submission deleted",
      embeds: [],
      components: [],
    }).catch((e) => e);

    return requestedResults;
  }
}
