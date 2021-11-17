import { User, Era } from "../../services";
import { GiraffeqlObjectType, ObjectTypeDefinition } from "giraffeql";
import {
  generateIdField,
  generateCreatedAtField,
  generateUpdatedAtField,
  generateCreatedByField,
  generateStringField,
  generateTextField,
  generateTypenameField,
  generateBooleanField,
  generateUnixTimestampField,
} from "../../core/helpers/typeDef";

export default new GiraffeqlObjectType(<ObjectTypeDefinition>{
  name: Era.typename,
  description: "Era type",
  fields: {
    ...generateIdField(),
    ...generateTypenameField(Era),
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
