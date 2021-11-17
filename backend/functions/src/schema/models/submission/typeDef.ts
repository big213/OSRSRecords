import {
  User,
  Event,
  Era,
  Submission,
  SubmissionCharacterParticipantLink,
} from "../../services";
import { GiraffeqlObjectType, ObjectTypeDefinition } from "giraffeql";
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
} from "../../core/helpers/typeDef";
import { Scalars } from "../..";
import { expandObject, flattenObject } from "../../core/helpers/shared";

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
    era: generateJoinableField({
      service: Era,
      allowNull: false,
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
    ranking: {
      type: Scalars.number,
      description:
        "The numerical score rank of this PB given its event, pbClass, and setSize, among public PBs only",
      allowNull: true,
      requiredSqlFields: ["score"],
      async resolver({ parentValue, fieldPath }) {
        // if not a current PB or user is not public or isFlagged, return null
        if (
          !parentValue.isCurrent ||
          !parentValue.createdBy.isPublic ||
          parentValue.isFlagged
        )
          return null;

        return 0;
      },
    },
    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User, true),

    submittedBy: generateStringField({
      allowNull: false,
      sqlOptions: {
        field: "submitted_by",
      },
    }),
  },
});
