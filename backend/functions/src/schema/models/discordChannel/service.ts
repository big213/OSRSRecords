import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { fetchTableRows, SqlWhereFieldObject } from "../../core/helpers/sql";
import { PaginatedService } from "../../core/services";
import { submissionStatusKenum } from "../../enums";
import {
  generateParticipantsText,
  placeEmojisMap,
  sendDiscordMessage,
  updateDiscordMessage,
} from "../../helpers/discord";
import { generateLeaderboardRoute, serializeTime } from "../../helpers/common";

import {
  DiscordChannelOutput,
  Submission,
  SubmissionCharacterParticipantLink,
} from "../../services";
import { permissionsCheck } from "../../core/helpers/permissions";
import { createObjectType } from "../../core/helpers/resolver";

type outputObject = {
  event: any;
  eventEraId: any | null;
  participants: any;
  ranksToShow: number;
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

    const discordChannelOutputs = await fetchTableRows({
      select: [
        {
          field: "event.id",
        },
        {
          field: "event.name",
        },
        {
          field: "event.avatarOverride",
        },
        {
          field: "event.eventClass.avatar",
        },
        {
          field: "participants",
        },
        {
          field: "eventEra.id",
        },
        {
          field: "useCurrentEventEra",
        },
        {
          field: "ranksToShow",
        },
      ],
      from: DiscordChannelOutput.typename,
      where: {
        fields: [
          {
            field: "discordChannel.id",
            operator: "eq",
            value: discordChannelId,
          },
        ],
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
        eventEraId: output.useCurrentEventEra ? null : output["eventEra.id"],
        participants: output.participants,
        ranksToShow: output.ranksToShow,
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

      if (output.useCurrentEventEra) {
        additionalFilters.push({
          field: "eventEra.isCurrent",
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

      // get the nth fastest score, where n = ranksToShow
      const nthScoreResults = await fetchTableRows({
        select: [
          {
            field: "score",
          },
        ],
        from: Submission.typename,
        distinctOn: ["score"],
        where: {
          fields: [
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
        offset: output.ranksToShow - 1,
      });

      const nthScore = nthScoreResults[0]?.score;

      if (nthScore) {
        const submissions = await fetchTableRows({
          select: [
            {
              field: "id",
            },
            {
              field: "event.name",
            },
            {
              field: "participants",
            },
            {
              field: "score",
            },
            {
              field: "externalLinks",
            },
          ],
          from: Submission.typename,
          where: {
            fields: [
              {
                field: "score",
                operator: "lte",
                value: nthScore,
              },
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
              ...additionalFilters,
            ],
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
        });

        heading.submissions.push(
          ...submissions.map((submission) => ({
            submission,
            characters: [],
          }))
        );
      }

      // for each submission, also populate the characters field if non-null
      for (const submissionObject of heading.submissions) {
        if (!submissionObject) continue;

        const submissionLinks = await fetchTableRows({
          select: [{ field: "character.name" }],
          from: SubmissionCharacterParticipantLink.typename,
          where: {
            fields: [
              {
                field: "submission",
                operator: "eq",
                value: submissionObject.submission.id,
              },
            ],
          },
        });

        submissionObject.characters = submissionLinks.map(
          (link) => link["character.name"]
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
            submissionObject.submission.externalLinks[0]
          })`;
        }
      );

      // if descriptionArray's last place is < outputObject.ranksToShow, fill in the remaining places
      while (currentPlace < outputObject.ranksToShow) {
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
          participants: outputObject.participants, // required
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

    // changed: if no primaryMessageId supplied, create one in the channel and use that messageId
    if (!args.primaryMessageId) {
      const discordMessage = await sendDiscordMessage(args.channelId, {
        content: "Placeholder message",
      });

      args.primaryMessageId = discordMessage.id;
    }

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(fieldPath),
        ...validatedArgs,
        createdBy: req.user!.id,
      },
      req,
      fieldPath,
    });

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
}
