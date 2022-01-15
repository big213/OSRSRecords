import {
  User,
  Event,
  Submission,
  SubmissionCharacterParticipantLink,
  EventEra,
} from "../../services";
import {
  GiraffeqlInputFieldType,
  GiraffeqlInputType,
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
import { submissionStatusKenum } from "../../enums";
import { getObjectType } from "../../core/helpers/resolver";

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
            allowNull: true,
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
    evidenceKey: generateStringField({
      allowNull: true,
      typeDefOptions: { addable: false, updateable: false },
      sqlOptions: {
        field: "evidence_key",
      },
    }),
    isRecord: generateBooleanField({
      allowNull: false,
      defaultValue: false,
      typeDefOptions: { addable: false, updateable: false },
      sqlOptions: {
        field: "is_record",
      },
    }),
    isRecordingVerified: generateBooleanField({
      allowNull: false,
      defaultValue: false,
      sqlOptions: {
        field: "is_recording_verified",
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
      args: new GiraffeqlInputFieldType({
        required: false,
        type: new GiraffeqlInputType({
          name: "rankingInput",
          fields: {
            excludeParticipants: new GiraffeqlInputFieldType({
              type: Scalars.boolean,
            }),
            excludeEventEra: new GiraffeqlInputFieldType({
              type: Scalars.boolean,
            }),
            isRelevantEventEra: new GiraffeqlInputFieldType({
              type: Scalars.boolean,
              allowNull: true,
            }),
          },
        }),
      }),
      resolver({ parentValue, args }) {
        const validatedArgs = <any>args;
        return Submission.calculateRank({
          eventId: parentValue.event.id,
          participants: validatedArgs?.excludeParticipants
            ? null
            : parentValue.participants,
          eventEraId: validatedArgs?.excludeEventEra
            ? null
            : parentValue.eventEra.id,
          isRelevantEventEra: validatedArgs?.isRelevantEventEra,
          status: submissionStatusKenum.fromUnknown(parentValue.status),
          score: parentValue.score,
        });
      },
    },
    previousRecord: {
      type: Submission.typeDefLookup,
      description:
        "The previous record given the event.id, participants, and eventEra.id, if any",
      allowNull: true,
      requiredSqlFields: [
        "isRecord",
        "happenedOn",
        "event.id",
        "participants",
        "eventEra.id",
      ],
      async resolver({ req, parentValue, fieldPath, query }) {
        // is !isRecord, return null
        if (!parentValue.isRecord) return null;

        // check when the previous record for the event.id, participants, status === 'approved', eventEra.id is
        const results = await getObjectType({
          typename: Submission.typename,
          req,
          fieldPath,
          externalQuery: query,
          sqlParams: {
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
            limit: 1,
          },
        });

        if (results.length < 1) {
          return null;
        }

        return results[0];
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
