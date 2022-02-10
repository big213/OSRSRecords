import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import {
  fetchTableRows,
  SqlWhereFieldObject,
  updateTableRow,
} from "../../core/helpers/sql";
import { PaginatedService } from "../../core/services";
import { eventEraModeKenum, submissionStatusKenum } from "../../enums";
import {
  generateParticipantsText,
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
    const discordChannel = await this.lookupRecord(
      ["id"],
      {
        id: args.id,
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
    const discordChannel = await this.lookupRecord(
      ["channelId", "primaryMessageId"],
      {
        id: discordChannelId,
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

      await updateTableRow({
        fields: {
          primaryMessageId: discordMessage.id,
        },
        table: this.typename,
        where: {
          id: discordChannelId,
        },
      });

      discordChannel.primaryMessageId = discordMessage.id;
    }

    const discordChannelOutputs = await fetchTableRows({
      select: [
        "event.id",
        "event.name",
        "event.avatarOverride",
        "event.eventClass.avatar",
        "participants",
        "eventEra.id",
        "eventEraMode",
        "ranksToShow",
        "linesLimit",
        "isSoloPersonalBest",
      ],
      table: DiscordChannelOutput.typename,
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

      const submissions = await fetchTableRows({
        select: ["id", "event.name", "participants", "score", "externalLinks"],
        table: Submission.typename,
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
        limit: output.linesLimit ?? undefined,
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

    return updateDiscordMessage(
      discordChannel.channelId,
      discordChannel.primaryMessageId,
      {
        content: null,
        embeds: this.generateDiscordRichContent(outputArray),
      }
    );
  }

  generateDiscordRichContent(outputArray: outputObject[]) {
    const embeds: any[] = [];

    outputArray.forEach((outputObject) => {
      let placeDiff = 0;
      let currentPlace = 0;
      const descriptionArray = outputObject.submissions.map(
        (submissionObject, index) => {
          currentPlace = placeDiff + 1;
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
          )} - ${submissionObject.characters.join(", ")} - [Proof](${
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
        title: `${outputObject.event.name} - ${generateParticipantsText(
          outputObject.participants
        )}`,
        url: generateLeaderboardRoute({
          eventId: outputObject.event.id, // required
          eventEraId: outputObject.eventEraId, // optional
          eventEraMode: outputObject.eventEraMode.name, // required
          participants: outputObject.participants ?? "__undefined", // required
          isSoloPersonalBest: outputObject.isSoloPersonalBest,
        }),
        thumbnail: outputObject.event.avatar
          ? {
              url: outputObject.event.avatar,
            }
          : undefined,
        description: descriptionArray.join("\n"),
      });
    });

    return embeds;
  }
}
