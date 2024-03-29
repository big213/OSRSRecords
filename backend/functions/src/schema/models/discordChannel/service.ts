import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { SqlWhereFieldObject } from "../../core/helpers/sql";
import { PaginatedService } from "../../core/services";
import { eventEraModeKenum, submissionStatusKenum } from "../../enums";
import {
  generateEventText,
  placeEmojisMap,
  sendDiscordMessage,
  updateDiscordMessage,
} from "../../helpers/discord";
import {
  generateLeaderboardRoute,
  isVideoUrl,
  serializeTime,
} from "../../helpers/common";
import { DiscordChannelOutput, Submission } from "../../services";
import { permissionsCheck } from "../../core/helpers/permissions";

type outputObject = {
  event: any;
  eventEraId: any | null;
  eventEraMode: eventEraModeKenum;
  participants: number | null;
  maxParticipants: number | null;
  ranksToShow: number;
  linesLimit: number | null;
  isSoloPersonalBest: boolean | null;
  submissions: {
    submission: any;
    characters: any[];
  }[];
};

export class DiscordChannelService extends PaginatedService {
  defaultTypename = "discordChannel";

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
  };

  sortFieldsMap = {
    id: {},
    createdAt: {},
    updatedAt: {},
  };

  searchFieldsMap = {
    name: {},
  };

  accessControl: AccessControlMap = {};

  @permissionsCheck("update")
  async refreshDiscordChannelMessage({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // confirm discordChannel exists, get id
    const discordChannel = await this.getFirstSqlRecord(
      {
        select: ["id"],
        where: {
          id: args.id,
        },
      },
      fieldPath
    );

    // refresh the output on that channel
    await this.renderOutput(discordChannel.id, fieldPath);

    return this.getRecord({
      req,
      fieldPath,
      args,
      query,
    });
  }

  // renders the message for a specific discord channel and returns the JSON
  async renderOutput(discordChannelId: string, fieldPath: string[]) {
    const discordChannel = await this.getFirstSqlRecord(
      {
        select: ["channelId", "primaryMessageId"],
        where: {
          id: discordChannelId,
        },
      },
      fieldPath
    );

    // if no primaryMessageId, create one in the channel and update the discordChannel
    if (!discordChannel.primaryMessageId) {
      const discordMessage = await sendDiscordMessage(
        discordChannel.channelId,
        {
          content: "Placeholder message",
        }
      );

      await this.updateSqlRecord({
        fields: {
          primaryMessageId: discordMessage.id,
        },
        where: {
          id: discordChannelId,
        },
      });

      discordChannel.primaryMessageId = discordMessage.id;
    }

    const discordChannelOutputs = await DiscordChannelOutput.getAllSqlRecord({
      select: [
        "event.id",
        "event.name",
        "event.avatarOverride",
        "event.maxParticipants",
        "event.eventClass.avatar",
        "participants",
        "eventEra.id",
        "eventEraMode",
        "ranksToShow",
        "linesLimit",
        "isSoloPersonalBest",
      ],
      where: {
        "discordChannel.id": discordChannelId,
      },
      orderBy: [
        {
          field: "sort",
          desc: false,
        },
      ],
      limit: 10, // maximum of 10 embeds allowed per discord message
    });

    const outputArray: outputObject[] = [];
    // for each output, generate the headings
    for (const output of discordChannelOutputs) {
      const heading: outputObject = {
        event: {
          id: output["event.id"],
          name: output["event.name"],
          avatar:
            output["event.avatarOverride"] ?? output["event.eventClass.avatar"],
        },
        eventEraId: output["eventEra.id"],
        eventEraMode: eventEraModeKenum.fromUnknown(output.eventEraMode),
        participants: output.participants,
        maxParticipants: output["event.maxParticipants"],
        isSoloPersonalBest: output.isSoloPersonalBest,
        ranksToShow: output.ranksToShow,
        linesLimit: output.linesLimit,
        submissions: [],
      };
      outputArray.push(heading);

      const additionalFilters: SqlWhereFieldObject[] = [];

      if (output.participants) {
        additionalFilters.push({
          field: "participants",
          operator: "eq",
          value: output.participants,
        });
      }

      if (heading.eventEraMode === eventEraModeKenum.CURRENT_ERA) {
        additionalFilters.push({
          field: "eventEra.isCurrent",
          operator: "eq",
          value: true,
        });
      } else if (heading.eventEraMode === eventEraModeKenum.RELEVANT_ERAS) {
        additionalFilters.push({
          field: "eventEra.isRelevant",
          operator: "eq",
          value: true,
        });
      } else if (output["eventEra.id"]) {
        additionalFilters.push({
          field: "eventEra.id",
          operator: "eq",
          value: output["eventEra.id"],
        });
      }

      if (output.isSoloPersonalBest !== null) {
        additionalFilters.push({
          field: "isSoloPersonalBest",
          operator: "eq",
          value: output.isSoloPersonalBest,
        });
      }

      const nthScore = await Submission.getNthFastestScore({
        n: output.ranksToShow,
        eventId: output["event.id"],
        eventEraMode: heading.eventEraMode,
        eventEraId: output["eventEra.id"],
        participants: output.participants,
        isSoloPersonalBest: output.isSoloPersonalBest,
      });

      const scoreFilters: SqlWhereFieldObject[] = [];

      // if nthScore doesn't exist, dont filter by score
      if (nthScore) {
        scoreFilters.push({
          field: "score",
          operator: "lte",
          value: nthScore,
        });
      }

      const submissions = await Submission.getAllSqlRecord({
        select: [
          "id",
          "event.name",
          "participants",
          "score",
          "externalLinks",
          "happenedOn",
        ],
        where: [
          {
            field: "event.id",
            operator: "eq",
            value: output["event.id"],
          },
          {
            field: "status",
            operator: "eq",
            value: submissionStatusKenum.APPROVED.index,
          },
          ...scoreFilters,
          ...additionalFilters,
        ],
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
        // if ranksToShow is 1, always fetch all of the submissions, event if there's more than linesLimit
        limit:
          output.ranksToShow === 1 ? undefined : output.linesLimit ?? undefined,
      });

      heading.submissions.push(
        ...submissions.map((submission) => ({
          submission,
          characters: [],
        }))
      );

      // for each submission, also populate the characters field if non-null
      for (const submissionObject of heading.submissions) {
        if (!submissionObject) continue;

        submissionObject.characters = await Submission.getSubmissionCharacters(
          submissionObject.submission.id
        );
      }
    }

    // if there is any output, perform the update
    const embeds = this.generateDiscordRichContent(outputArray);
    if (embeds.length > 0) {
      return updateDiscordMessage(
        discordChannel.channelId,
        discordChannel.primaryMessageId,
        {
          content: null,
          embeds: this.generateDiscordRichContent(outputArray),
        }
      );
    }
  }

  generateDiscordRichContent(outputArray: outputObject[]) {
    const embeds: any[] = [];

    outputArray.forEach((outputObject) => {
      let placeDiff = 0;
      let currentPlace = 0;

      const leaderboardUrl = generateLeaderboardRoute({
        eventId: outputObject.event.id, // required
        eventEraId: outputObject.eventEraId, // optional
        eventEraMode: outputObject.eventEraMode.name, // required
        participants: outputObject.participants ?? "__undefined", // required
        isSoloPersonalBest: outputObject.isSoloPersonalBest,
      });

      const descriptionArray = outputObject.submissions.map(
        (submissionObject, index) => {
          currentPlace = placeDiff + 1;

          // if this is the 4th entry and the linesLimit is 3, MUST be due to ranksToShow: 1
          // on the 4th entry, add a "+ 1 more", then after that, return null, which will be ignored.
          if (outputObject.linesLimit && index + 1 > outputObject.linesLimit) {
            if (index === outputObject.linesLimit) {
              return `${
                placeEmojisMap[currentPlace] ?? "(" + currentPlace + ")"
              } [(+${
                outputObject.submissions.length - outputObject.linesLimit
              } more)](${leaderboardUrl})`;
            } else {
              return null;
            }
          }

          // check the next record and see if it exists and the score is not the same
          if (
            outputObject.submissions[index + 1] &&
            submissionObject.submission.score !==
              outputObject.submissions[index + 1]!.submission.score
          ) {
            // if it is, increment placeDiff. else, do not
            placeDiff++;
          }

          return `${
            placeEmojisMap[currentPlace] ?? "(" + currentPlace + ")"
          } ${serializeTime(
            submissionObject.submission.score
          )} - ${submissionObject.characters.join(", ")} - <t:${Math.floor(
            submissionObject.submission.happenedOn
          )}:D> - [Proof](${
            submissionObject.submission.externalLinks.find(
              (link) => !isVideoUrl(link)
            ) ?? submissionObject.submission.externalLinks[0]
          })`;
        }
      );

      // if descriptionArray's last place is < outputObject.ranksToShow, fill in the remaining places. do not exceed linesLimit, if not null
      while (
        currentPlace < outputObject.ranksToShow &&
        (!outputObject.linesLimit ||
          (outputObject.linesLimit &&
            descriptionArray.length < outputObject.linesLimit))
      ) {
        currentPlace++;
        descriptionArray.push(
          `${placeEmojisMap[currentPlace] ?? "(" + currentPlace + ")"} N/A`
        );
      }

      embeds.push({
        title: generateEventText(
          outputObject.event.name,
          outputObject.participants,
          outputObject.maxParticipants
        ),
        url: leaderboardUrl,
        thumbnail: outputObject.event.avatar
          ? {
              url: outputObject.event.avatar,
            }
          : undefined,
        description: descriptionArray.filter((ele) => ele).join("\n"),
      });
    });

    return embeds;
  }
}
