import { User, Character } from "../../services";
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
} from "../../core/helpers/typeDef";

export default new GiraffeqlObjectType(<ObjectTypeDefinition>{
  name: Character.typename,
  description: "Character type",
  fields: {
    ...generateIdField(),
    ...generateTypenameField(Character),
    name: generateStringField({
      allowNull: false,
    }),
    standardizedName: generateStringField({
      allowNull: false,
      sqlOptions: {
        field: "standardized_name",
        unique: true,
      },
      typeDefOptions: {
        addable: false,
        updateable: false,
      },
    }),
    avatar: generateStringField({ allowNull: true }),
    description: generateTextField({
      allowNull: true,
    }),
    ownedBy: generateJoinableField({
      service: User,
      allowNull: true,
      sqlOptions: {
        field: "owned_by",
      },
    }),
    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User, true),
  },
});
