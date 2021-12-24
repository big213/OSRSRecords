import {
  User,
  Event,
  Submission,
  SubmissionCharacterParticipantLink,
  EventEra,
} from "../../services";
import {
  GiraffeqlInputFieldType,
  GiraffeqlObjectType,
  ObjectTypeDefinition,
} from "giraffeql";
import {
  generateIdField,
  generateCreatedAtField,
  generateUpdatedAtField,
  generateCreatedByField,
  generateStringField,
  generateTextField,
  generateTypenameField,
  generateJoinableField,
  generateIntegerField,
  generateArrayField,
  generateUnixTimestampField,
  generateEnumField,
  generatePaginatorPivotResolverObject,
  generatePivotResolverObject,
  generateBooleanField,
} from "../../core/helpers/typeDef";
import { Scalars } from "../..";
import { fetchTableRows } from "../../core/helpers/sql";
import { submissionStatusKenum } from "../../enums";

export default new GiraffeqlObjectType(<ObjectTypeDefinition>{
  name: Submission.typename,
  description: "Submission type",
  fields: {
    ...generateIdField(),
    ...generateTypenameField(Submission),
    event: generateJoinableField({
      service: Event,
      allowNull: false,
    }),
    eventEra: generateJoinableField({
      service: EventEra,
      allowNull: false,
      sqlOptions: { field: "event_era" },
    }),
    participants: generateIntegerField({
      allowNull: false,
      defaultValue: 0,
      typeDefOptions: { addable: false, updateable: false },
    }),
    participantsList: generateArrayField({
      allowNull: false,
      type: new GiraffeqlObjectType({
        name: "participantsList",
        fields: {
          discordId: {
            type: Scalars.string,
            allowNull: false,
          },
          characterId: {
            type: Scalars.id,
            allowNull: false,
          },
        },
      }),
      sqlOptions: { field: "participants_list" },
    }),
    participantsLinks: generatePaginatorPivotResolverObject({
      pivotService: SubmissionCharacterParticipantLink,
      filterByField: "submission.id",
    }),
    participantsLinksList: generatePivotResolverObject({
      pivotService: SubmissionCharacterParticipantLink,
      filterByField: "submission.id",
    }),
    score: generateIntegerField({
      allowNull: false,
      typeDefOptions: { addable: false, updateable: false },
    }),
    timeElapsed: generateIntegerField({
      allowNull: false,
      sqlOptions: {
        field: "time_elapsed",
      },
      typeDefOptions: { addable: true, updateable: true },
    }),
    happenedOn: generateUnixTimestampField({
      allowNull: false,
      sqlOptions: {
        field: "happened_on",
      },
    }),
    status: generateEnumField({
      scalarDefinition: Scalars.submissionStatus,
      allowNull: false,
      defaultValue: "SUBMITTED",
      isKenum: true,
      typeDefOptions: { addable: false },
    }),
    world: generateIntegerField({
      allowNull: true,
    }),
    files: generateArrayField({
      allowNull: false,
      type: Scalars.id,
      allowNullElement: false,
    }),
    externalLinks: generateArrayField({
      allowNull: false,
      type: Scalars.url,
      allowNullElement: false,
      sqlOptions: {
        field: "external_links",
      },
    }),
    privateComments: generateTextField({
      allowNull: true,
      sqlOptions: {
        field: "private_comments",
      },
    }),
    publicComments: generateTextField({
      allowNull: true,
      sqlOptions: {
        field: "public_comments",
      },
    }),
    discordMessageId: generateStringField({
      allowNull: true,
      sqlOptions: {
        field: "discord_message_id",
      },
      typeDefOptions: { addable: false, updateable: false }, // automatically generated
    }),
    mainExternalLink: {
      type: Scalars.url,
      allowNull: true,
      requiredSqlFields: ["externalLinks"],
      async resolver({ parentValue }) {
        if (!Array.isArray(parentValue.externalLinks)) return null;

        return parentValue.externalLinks[0] ?? null;
      },
    },
    isRecord: generateBooleanField({
      allowNull: false,
      defaultValue: false,
      typeDefOptions: { addable: false, updateable: false },
      sqlOptions: {
        field: "is_record",
      },
    }),
    ranking: {
      type: Scalars.number,
      description:
        "The numerical score rank of this PB given its event, pbClass, and setSize, among public PBs only",
      allowNull: true,
      requiredSqlFields: [
        "score",
        "event.id",
        "participants",
        "status",
        "eventEra.id",
      ],
      resolver({ parentValue }) {
        return Submission.calculateRank({
          eventId: parentValue.event.id,
          participants: parentValue.participants,
          eventEraId: parentValue.eventEra.id,
          status: submissionStatusKenum.fromUnknown(parentValue.status),
          score: parentValue.score,
        });
      },
    },
    previousRecordHappenedOn: {
      type: Scalars.unixTimestamp,
      description:
        "The date of the previous record given the event.id, participants, and eventEra.id, if any",
      allowNull: true,
      requiredSqlFields: [
        "isRecord",
        "happenedOn",
        "event.id",
        "participants",
        "eventEra.id",
      ],
      async resolver({ parentValue }) {
        // is !isRecord, return null
        if (!parentValue.isRecord) return null;

        // check when the previous record for the event.id, participants, status === 'approved', eventEra.id is
        const results = await fetchTableRows({
          select: [
            {
              field: "happenedOn",
            },
          ],
          from: Submission.typename,
          where: {
            fields: [
              {
                field: "event.id",
                operator: "eq",
                value: parentValue.event.id,
              },
              {
                field: "participants",
                operator: "eq",
                value: parentValue.participants,
              },
              {
                field: "status",
                operator: "eq",
                value: submissionStatusKenum.APPROVED.index,
              },
              {
                field: "eventEra.id",
                operator: "eq",
                value: parentValue.eventEra.id,
              },
              {
                field: "isRecord",
                operator: "eq",
                value: true,
              },
              {
                field: "happenedOn",
                operator: "lt",
                value: parentValue.happenedOn,
              },
            ],
          },
          orderBy: [
            {
              field: "happenedOn",
              desc: true,
            },
          ],
          limit: 1,
        });

        // if no previous record, return null
        if (results.length < 1) {
          return null;
        }

        const previousResult = results[0];

        return previousResult.happenedOn;
      },
    },

    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User, true),

    submittedBy: generateStringField({
      allowNull: true,
      sqlOptions: {
        field: "submitted_by",
      },
    }),
    discordId: generateStringField({
      allowNull: true,
      sqlOptions: {
        field: "discord_id",
      },
    }),
  },
});
