import {
  User,
  Event,
  Era,
  Submission,
  SubmissionCharacterParticipantLink,
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
import { countTableRows, fetchTableRows } from "../../core/helpers/sql";
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
      typeDefOptions: { addable: true, updateable: false },
    }),
    era: generateJoinableField({
      service: Era,
      allowNull: false,
      typeDefOptions: { addable: true, updateable: false },
    }),
    participants: generateIntegerField({
      allowNull: false,
      defaultValue: 0,
      typeDefOptions: { addable: false, updateable: false },
    }),
    participantsLinks: generatePaginatorPivotResolverObject({
      pivotService: SubmissionCharacterParticipantLink,
      filterByField: "submission.id",
    }),
    participantsList: generatePivotResolverObject({
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
      typeDefOptions: { addable: true, updateable: false },
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
        "era.id",
      ],
      resolver({ parentValue }) {
        return Submission.calculateRank({
          eventId: parentValue.event.id,
          participants: parentValue.participants,
          eraId: parentValue.era.id,
          status: submissionStatusKenum.fromUnknown(parentValue.status),
          score: parentValue.score,
        });
      },
    },
    previousRecordHappenedOn: {
      type: Scalars.unixTimestamp,
      description:
        "The date of the previous record given the event.id, participants, and era.id, if any",
      allowNull: true,
      requiredSqlFields: [
        "isRecord",
        "happenedOn",
        "event.id",
        "participants",
        "era.id",
      ],
      async resolver({ parentValue }) {
        // is !isRecord, return null
        if (!parentValue.isRecord) return null;

        // check when the previous record for the event.id, participants, status === 'approved', era.id is
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
                field: "era.id",
                operator: "eq",
                value: parentValue.era.id,
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
