import { User, EventEra, Event } from "../../services";
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
  generateUnixTimestampField,
  generateBooleanField,
} from "../../core/helpers/typeDef";

export default new GiraffeqlObjectType(<ObjectTypeDefinition>{
  name: EventEra.typename,
  description: "EventEra type",
  fields: {
    ...generateIdField(),
    ...generateTypenameField(EventEra),
    event: generateJoinableField({
      service: Event,
      allowNull: false,
    }),
    name: generateStringField({ allowNull: false }),
    avatar: generateStringField({ allowNull: true }),
    description: generateTextField({
      allowNull: true,
    }),
    beginDate: generateUnixTimestampField({
      allowNull: false,
      sqlOptions: { field: "begin_date" },
    }),
    endDate: generateUnixTimestampField({
      allowNull: true,
      sqlOptions: { field: "end_date" },
    }),
    isBuff: generateBooleanField({
      allowNull: true,
      sqlOptions: { field: "is_buff" },
    }),
    isRelevant: generateBooleanField({
      allowNull: false,
      defaultValue: false,
      sqlOptions: { field: "is_relevant" },
      typeDefOptions: {
        addable: false,
        updateable: false,
      },
    }),
    isCurrent: generateBooleanField({
      allowNull: false,
      defaultValue: false,
      sqlOptions: { field: "is_current" },
    }),
    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User),
  },
});
