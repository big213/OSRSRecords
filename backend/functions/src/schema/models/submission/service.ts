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
  generateParticipantsText,
  getGuildMemberId,
  createDMChannel,
  generateViewSubmissionButtonComponent,
  generateSubmissionStatusDropdownComponent,
  submissionStatusMap,
  crosspostDiscordMessage,
  discordUserIdMap,
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
  isVideoUrl,
  serializeTime,
} from "../../helpers/common";
import { objectOnlyHasFields } from "../../core/helpers/shared";
import { GiraffeqlBaseError } from "giraffeql";

type UpdateLogPostSubmission = {
  submission: any;
  characters: string[];
};

type RelevantErasUpdateLogPost = {
  currentSubmission: UpdateLogPostSubmission;
  ranksToShow: number | null;
  relevantChannelIds: Set<string>;
  ranking: number | null;
  isWR:
    | false
    | {
        isTie: boolean;
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
  isTie: boolean;
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
  }: {
    eventId: string;
    participants: number | null;
    eventEraId: string | null;
    isRelevantEventEra?: boolean | null;
    isSoloPersonalBest?: boolean | null;
    characterId?: string | null;
    status: submissionStatusKenum | null;
    score: number;
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

    const resultsCount = await countTableRows({
      field: "score",
      distinct: true,
      table: this.typename,
      where: [whereObject],
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
      ["beginDate", "endDate", "event.id"],
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

    // changed: confirm if eventEra.event is same as event
    if (eventEraRecord["event.id"] !== validatedArgs.event) {
      throw new GiraffeqlBaseError({
        message: `eventEra must correspond to the event`,
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
          title: participant.discordId,
          createdBy: req.user?.id, // nullable
        },
        req,
        fieldPath,
      });
    }

    // if the record was added as approved, also need to run syncSubmissionIsRelevantRecord and syncSoloPBState
    // HOWEVER, will NOT be triggering broadcastUpdateLogs and syncDiscordLeaderboards. admin can flick the status if they want to trigger these events
    if (inferredStatus === submissionStatusKenum.APPROVED) {
      await this.syncIsRelevantRecord(args.event, args.participantsList.length);

      // also need to sync the isSoloPersonalBest state if it is a solo record
      if (validatedArgs.participantsList.length === 1) {
        await this.syncSoloPBState(addResults.id, args.event);
      }
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

      await updateTableRow({
        fields: {
          discordMessageId: discordMessage.id,
        },
        table: this.typename,
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
        "participantsList",
      ],
      validatedArgs.item,
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

    // changed: if status is being updated from !APPROVED to APPROVED, need to validate the evidenceKey
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

    // note: currently NOT validating if happenedOn corresponds to eventEra OR if participantsList.length corresponds to event, as this should only be accessible by reviewers who should know what they are doing

    // convert any lookup/joined fields into IDs
    await this.handleLookupArgs(validatedArgs.fields, fieldPath);

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
    });

    // changed: todo: if participantsList was changed in any way, need to also delete all submissionParticipantLinks and re-sync them
    if (validatedArgs.fields.participantsList) {
      if (
        JSON.stringify(validatedArgs.fields.participantsList) !==
        JSON.stringify(item.participantsList)
      ) {
        await deleteTableRow({
          table: SubmissionCharacterParticipantLink.typename,
          where: {
            submission: item.id,
          },
        });

        for (const participant of validatedArgs.fields.participantsList) {
          await createObjectType({
            typename: SubmissionCharacterParticipantLink.typename,
            addFields: {
              id: await SubmissionCharacterParticipantLink.generateRecordId(
                fieldPath
              ),
              submission: item.id,
              character: participant.characterId,
              title: participant.discordId,
              createdBy: req.user?.id, // nullable
            },
            req,
            fieldPath,
          });
        }
      }
    }

    // also need to sync the isSoloPersonalBest if it is a solo record
    if (item.participants === 1) {
      await this.syncSoloPBState(item.id, item["event.id"]);
    }

    if (newStatus) {
      // this is the RELEVANT_ERA rank
      const relevantEraRanking = await this.calculateRank({
        eventId: item["event.id"],
        participants: item.participants,
        eventEraId: null,
        isRelevantEventEra: true,
        isSoloPersonalBest: null,
        status: newStatus,
        score: item.score,
      });

      const soloPBRanking = await this.calculateRank({
        eventId: item["event.id"],
        participants: item.participants,
        eventEraId: null,
        isRelevantEventEra: true,
        isSoloPersonalBest: true,
        status: newStatus,
        score: item.score,
      });
      // if the status changed from APPROVED->!APPROVED, or ANY->APPROVED need to update discord leaderboards
      if (
        (previousStatus === submissionStatusKenum.APPROVED &&
          newStatus !== submissionStatusKenum.APPROVED) ||
        newStatus === submissionStatusKenum.APPROVED
      ) {
        // also need to sync the isRelevantRecord state
        await this.syncIsRelevantRecord(item["event.id"], item.participants);

        await this.syncDiscordLeaderboards({
          eventId: item["event.id"],
          participants: item.participants,
          eventEraId: item["eventEra.id"],
          relevantEraRanking,
          soloPBRanking,
        });
      }

      // if the status changed from ANY->APPROVED, need to also possibly send an announcement in update-logs
      await this.broadcastUpdateLogs({
        submissionId: item.id,
        relevantEraRanking,
        soloPBRanking,
        fieldPath,
      });

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
  }: {
    eventId: string;
    participants: number;
    eventEraId: string;
    relevantEraRanking: number | null;
    soloPBRanking: number | null;
  }) {
    // discord channels that need to be refreshed
    const discordChannelIds: Set<string> = new Set();

    // see if any discord leaderboards with eventEraMode: "RELEVANT_ERAS" need to be refreshed
    if (relevantEraRanking) {
      const discordChannelOutputs = await fetchTableRows({
        select: ["discordChannel.id"],
        table: DiscordChannelOutput.typename,
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
      });

      discordChannelOutputs.forEach((ele) => {
        discordChannelIds.add(ele["discordChannel.id"]);
      });
    }

    // see if any discord leaderboards with isSoloPersonalBest: true need to be refreshed
    if (participants === 1 && soloPBRanking) {
      const discordChannelOutputs = await fetchTableRows({
        select: ["discordChannel.id"],
        table: DiscordChannelOutput.typename,
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
  }: {
    n: number;
    eventId: string;
    eventEraMode: eventEraModeKenum;
    eventEraId: string | null;
    isSoloPersonalBest: boolean | null;
    characterId?: string | null;
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
    const nthScoreResults = await fetchTableRows({
      select: ["score"],
      table: this.typename,
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
    });

    return nthScoreResults[0]?.score ?? null;
  }

  async getSubmissionCharacters(submissionId: string) {
    const submissionLinks = await fetchTableRows({
      select: ["character.name"],
      table: SubmissionCharacterParticipantLink.typename,
      where: {
        submission: submissionId,
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

  // this will broadcast an update in update-logs channel if there were any changes in leaderboards
  async broadcastUpdateLogs({
    submissionId,
    relevantEraRanking,
    soloPBRanking,
    fieldPath,
  }: {
    submissionId: string;
    relevantEraRanking: number | null;
    soloPBRanking: number | null;
    fieldPath: string[];
  }) {
    const discordMessageContents: {
      content: string;
      isSoloPersonalBest: boolean | null;
    }[] = [];

    // fetch relevant submission info
    const submission = await this.lookupRecord(
      [
        "id",
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

    const eventStr = `${submission["event.name"]} - ${generateParticipantsText(
      submission.participants
    )}`;

    const submissionLinks = await fetchTableRows({
      select: ["character.name", "character.id"],
      table: SubmissionCharacterParticipantLink.typename,
      where: {
        submission: submissionId,
      },
      orderBy: [
        {
          field: "character.name",
          desc: false,
        },
      ],
    });

    const relevantErasUpdateLogPost: RelevantErasUpdateLogPost = {
      currentSubmission: {
        submission,
        characters: submissionLinks.map((link) => link["character.name"]),
      },
      ranksToShow: null,
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
      const discordChannelOutputs = await fetchTableRows({
        select: ["ranksToShow", "discordChannel.channelId"],
        table: DiscordChannelOutput.typename,
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
              {
                field: "isSoloPersonalBest",
                value: true,
              },
            ],
          },
          fieldPath
        );

        // was it a tie?
        soloPBUpdateLogPost.isTie = sameScoreCount > 1;

        // get the soloPBRank of the character's previous record (given relevantEra, eventId, participants), if any.
        const charactersSecondFastestScore = await this.getNthFastestScore({
          n: 2,
          eventId: submission["event.id"],
          eventEraId: null,
          eventEraMode: eventEraModeKenum.RELEVANT_ERAS,
          participants: 1,
          isSoloPersonalBest: null,
          characterId: firstCharacterId,
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
        } else if (!soloPBUpdateLogPost.isTie) {
          // if it was not an improvement in the leaderboard AND it was not a tie, someone (or multiple people) just got kicked to 11th place. find out who that was, if any
          const nPlusOneHighestScore = await this.getNthFastestScore({
            n: soloPBUpdateLogPost.ranksToShow + 1,
            eventId: submission["event.id"],
            eventEraId: null,
            eventEraMode: eventEraModeKenum.RELEVANT_ERAS,
            participants: 1,
            isSoloPersonalBest: true,
          });

          if (nPlusOneHighestScore) {
            soloPBUpdateLogPost.kickedSubmissions = [];
            // get ids of submissions with this score
            const submissions = await fetchTableRows({
              select: ["id"],
              table: this.typename,
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
            });

            for (const submission of submissions) {
              soloPBUpdateLogPost.kickedSubmissions.push({
                characters: await this.getSubmissionCharacters(submission.id),
                score: nPlusOneHighestScore,
              });
            }
          }
        }
      }
    }

    // check if this record would appear in any normal style leaderboards. eventEraMode: relevant_eras only
    if (relevantErasUpdateLogPost.ranking) {
      const discordChannelOutputs = await fetchTableRows({
        select: ["ranksToShow", "discordChannel.channelId"],
        table: DiscordChannelOutput.typename,
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
      });

      if (discordChannelOutputs.length > 0) {
        relevantErasUpdateLogPost.ranksToShow = Math.max(
          ...discordChannelOutputs.map((ele) => ele.ranksToShow)
        );

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

            // was it a tie of a WR?
            relevantErasUpdateLogPost.isWR.isTie = sameScoreCount > 1;
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
            });

            if (secondPlaceScore) {
              const secondPlaceSubmissions = await fetchTableRows({
                select: ["id", "score"],
                table: this.typename,
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
              });

              for (const currentSubmission of secondPlaceSubmissions) {
                relevantErasUpdateLogPost.secondPlaceSubmissions.push({
                  submission: currentSubmission,
                  characters: await this.getSubmissionCharacters(
                    currentSubmission.id
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
      if (soloPBUpdateLogPost.currentUserSecondPlaceSubmission) {
        discordMessageContents.push({
          content: `${formatUnixTimestamp(submission.happenedOn)}\n\n${
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
          content: `${formatUnixTimestamp(submission.happenedOn)}\n\n${
            soloPBUpdateLogPost.relevantChannelIds.size
              ? [...soloPBUpdateLogPost.relevantChannelIds]
                  .map((channelId) => "<#" + channelId + ">")
                  .join(" ") + "\n\n"
              : ""
          }🔸 Added new **Rank ${soloPBUpdateLogPost.ranking} - ${eventStr} ${
            soloPBUpdateLogPost.isWR ? "WR" : "PB"
          } - ${serializeTime(
            submission.score
          )}** by\n\`\`\`fix\n${soloPBUpdateLogPost.currentSubmission.characters.join(
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
      if (
        relevantErasUpdateLogPost.isWR &&
        !relevantErasUpdateLogPost.isWR.isTie &&
        relevantErasUpdateLogPost.secondPlaceSubmissions &&
        relevantErasUpdateLogPost.secondPlaceSubmissions.length > 0
      ) {
        discordMessageContents.push({
          content: `${formatUnixTimestamp(submission.happenedOn)}\n\n${
            relevantErasUpdateLogPost.relevantChannelIds.size
              ? [...relevantErasUpdateLogPost.relevantChannelIds]
                  .map((channelId) => "<#" + channelId + ">")
                  .join(" ") + "\n\n"
              : ""
          }🔸 Replaced **${eventStr} WR - ${serializeTime(
            relevantErasUpdateLogPost.secondPlaceSubmissions[0].submission.score
          )}** by\n${relevantErasUpdateLogPost.secondPlaceSubmissions
            .map(
              (submissionObject) =>
                `\`\`\`diff\n- ${submissionObject.characters.join(", ")}\`\`\``
            )
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
        // if we end up here, relevantErasUpdateLogPost.isWR will always be either false or { isTie: true }
        discordMessageContents.push({
          content: `${formatUnixTimestamp(submission.happenedOn)}\n\n${
            relevantErasUpdateLogPost.relevantChannelIds.size
              ? [...relevantErasUpdateLogPost.relevantChannelIds]
                  .map((channelId) => "<#" + channelId + ">")
                  .join(" ") + "\n\n"
              : ""
          }🔸 Added **${eventStr} - ${serializeTime(
            submission.score
          )}** by\n\`\`\`fix\n${relevantErasUpdateLogPost.currentSubmission.characters.join(
            ", "
          )}\`\`\`\n🔸 ${
            relevantErasUpdateLogPost.isWR ? "as a tie for" : "to"
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
  async syncSoloPBState(submissionId: string, eventId: string) {
    const submissionLinks = await fetchTableRows({
      select: ["character.id"],
      table: SubmissionCharacterParticipantLink.typename,
      where: {
        submission: submissionId,
      },
    });

    // only need to check for participants = 1
    if (submissionLinks.length !== 1) return;

    const characterId = submissionLinks[0]["character.id"];

    // get fastest approved submission by user given participants = 1 and event
    const [fastestRecord, secondFastestRecord] = await fetchTableRows({
      select: ["id"],
      table: this.typename,
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
      ],
      limit: 2,
    });

    if (!fastestRecord) {
      return;
    }

    // set all of the approved records for user, participants = 1, and eventId to false.
    // only need to do this if there's more than 1 submission returned
    if (secondFastestRecord) {
      // need to lookup IDs since it is not possible to do update where "submissionCharacterParticipantLink/character.id"
      const submissions = await fetchTableRows({
        select: ["id"],
        table: this.typename,
        where: {
          "event.id": eventId,
          participants: 1,
          status: submissionStatusKenum.APPROVED.index,
          "submissionCharacterParticipantLink/character.id": characterId,
        },
      });

      await updateTableRow({
        fields: {
          isSoloPersonalBest: false,
        },
        table: this.typename,
        where: [
          {
            field: "id",
            operator: "in",
            value: submissions.map((submission) => submission.id),
          },
        ],
      });
    }

    // set the fastest record isSoloPersonalBest to true
    await updateTableRow({
      fields: {
        isSoloPersonalBest: true,
      },
      table: this.typename,
      where: {
        id: fastestRecord.id,
      },
    });
  }

  // generate some text summarizing a submission's reviewer comments only
  async generateSubmissionReviewerCommentsText(submissionId: string) {
    // get submission info
    const [submission] = await fetchTableRows({
      select: ["id", "reviewerComments"],
      table: this.typename,
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
    const [submission] = await fetchTableRows({
      select: [
        "id",
        "event.name",
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
      table: this.typename,
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

    return `Happened On: ${formatUnixTimestamp(
      submission.happenedOn
    )}\nEvent: ${submission["event.name"]} - ${generateParticipantsText(
      submission.participants
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

  async syncIsRelevantRecord(eventId: string, participants: number) {
    // reset all isRecord flags for the event.
    await updateTableRow({
      fields: {
        isRelevantRecord: false,
      },
      table: this.typename,
      where: {
        event: eventId,
        participants: participants,
      },
    });

    // lookup all approved submissions in relevantEra, sorting by happenedOn
    const submissions = await fetchTableRows({
      select: ["id", "score"],
      table: this.typename,
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
    });

    // go through each submission and if it is a relevantRecord, flag it
    let currentRecord: number = Infinity;

    for (const submission of submissions) {
      // is it better than the current record? if so, flag it and set that as new record
      if (submission.score < currentRecord) {
        currentRecord = submission.score;
        await updateTableRow({
          fields: {
            isRelevantRecord: true,
          },
          table: this.typename,
          where: {
            id: submission.id,
          },
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
    const item = await this.lookupRecord(
      [
        "id",
        "status",
        "event.id",
        "eventEra.id",
        "participants",
        "isRelevantRecord",
        "score",
        "discordMessageId",
      ],
      validatedArgs,
      fieldPath
    );

    // this is the RELEVANT_ERA rank
    const relevantEraRanking = await this.calculateRank({
      eventId: item["event.id"],
      participants: item.participants,
      eventEraId: null,
      isRelevantEventEra: true,
      isSoloPersonalBest: null,
      status: submissionStatusKenum.fromUnknown(item.status),
      score: item.score,
    });

    const soloPBRanking = await this.calculateRank({
      eventId: item["event.id"],
      participants: item.participants,
      eventEraId: null,
      isRelevantEventEra: true,
      isSoloPersonalBest: true,
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
        submission: item.id,
      },
    });

    // if the status was APPROVED on the deleted record, need to sync any leaderboard that contains it
    if (
      submissionStatusKenum.fromUnknown(item.status) ===
      submissionStatusKenum.APPROVED
    ) {
      await this.syncDiscordLeaderboards({
        eventId: item["event.id"],
        participants: item.participants,
        eventEraId: item["eventEra.id"],
        relevantEraRanking,
        soloPBRanking,
      });

      // also need to sync the isSoloPersonalBest state if it is a solo record
      if (item.participants === 1) {
        await this.syncSoloPBState(item.id, item["event.id"]);
      }

      // also need to sync the isRelevantRecord state if it was a relevant record
      if (item.isRelevantRecord) {
        await this.syncIsRelevantRecord(item["event.id"], item.participants);
      }
    }

    // edit the discordMessageId to indicate it was deleted
    await updateDiscordMessage(channelMap.subAlerts, item.discordMessageId, {
      content: "Submission deleted",
      embeds: [],
      components: [],
    }).catch((e) => e);

    return requestedResults;
  }
}
