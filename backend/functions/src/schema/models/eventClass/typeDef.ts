import { User, EventClass } from "../../services";
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
  name: EventClass.typename,
  description: "Event Class type",
  fields: {
    ...generateIdField(),
    ...generateTypenameField(EventClass),
    name: generateStringField({ allowNull: false }),
    avatar: generateStringField({ allowNull: true }),
    description: generateTextField({
      allowNull: true,
    }),
    parent: generateJoinableField({
      service: EventClass,
      allowNull: true,
    }),
    backgroundImage: generateStringField({
      allowNull: true,
      sqlOptions: { field: "background_image" },
    }),
    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User),
  },
});
