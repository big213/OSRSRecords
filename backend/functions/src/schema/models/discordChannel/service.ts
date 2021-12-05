import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { fetchTableRows, SqlWhereFieldObject } from "../../core/helpers/sql";
import { PaginatedService } from "../../core/services";
import { submissionStatusKenum } from "../../enums";
import {
  sendDiscordMessage,
  updateDiscordMessage,
} from "../../helpers/discord";
import {
  generateCrudRecordInterfaceUrl,
  generateLeaderboardPageOptions,
  serializeTime,
} from "../../helpers/common";

import {
  DiscordChannelOutput,
  Submission,
  SubmissionCharacterParticipantLink,
} from "../../services";
import { permissionsCheck } from "../../core/helpers/permissions";
import { createObjectType } from "../../core/helpers/resolver";

type outputObject = {
  event: any;
  era: any;
  participants: any;
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
          field: "participants",
        },
        {
          field: "era.id",
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
    });

    const outputArray: outputObject[] = [];
    // for each output, generate the headings
    for (const output of discordChannelOutputs) {
      const heading: outputObject = {
        event: {
          id: output["event.id"],
          name: output["event.name"],
        },
        era: {
          id: output["era.id"],
        },
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

      if (output["era.id"]) {
        additionalFilters.push({
          field: "era.id",
          operator: "eq",
          value: output["era.id"],
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

      // for each submission, also populate the characters field
      for (const submissionObject of heading.submissions) {
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
        title: `${outputObject.event.name} ${outputObject.participants}-Man`,
        url: generateCrudRecordInterfaceUrl(
          "/leaderboard",
          generateLeaderboardPageOptions({
            eventId: outputObject.event.id,
            eraId: outputObject.era.id,
            participants: outputObject.participants,
          })
        ),
        description: "Click link to view full leaderboard",
      });

      outputObject.submissions.forEach((submissionObject) => {
        embeds.push({
          title: `${serializeTime(
            submissionObject.submission.score
          )} - ${submissionObject.characters.join(", ")}`,
          url: submissionObject.submission.externalLinks[0],
          color: 15105570,
        });
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
