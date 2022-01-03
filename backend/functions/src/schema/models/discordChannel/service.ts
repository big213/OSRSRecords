import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { fetchTableRows, SqlWhereFieldObject } from "../../core/helpers/sql";
import { PaginatedService } from "../../core/services";
import { submissionStatusKenum } from "../../enums";
import {
  generateParticipantsText,
  placeEmojis,
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
  submissions: ({
    submission: any;
    characters: any[];
  } | null)[];
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
        limit: output.ranksToShow,
      });

      heading.submissions.push(
        ...submissions.map((submission) => ({
          submission,
          characters: [],
        }))
      );

      // if submissions is not the correct length, fill in with nulls until it is
      while (heading.submissions.length < output.ranksToShow) {
        heading.submissions.push(null);
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
        description: outputObject.submissions
          .map((submissionObject, index) => {
            if (submissionObject) {
              return `${
                placeEmojis[index] ?? "(" + (index + 1) + ")"
              } ${serializeTime(
                submissionObject.submission.score
              )} - ${submissionObject.characters.join(", ")} - [Proof](${
                submissionObject.submission.externalLinks[0]
              })`;
            } else {
              return `${placeEmojis[index] ?? "(" + (index + 1) + ")"} N/A`;
            }
          })
          .join("\n"),
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
