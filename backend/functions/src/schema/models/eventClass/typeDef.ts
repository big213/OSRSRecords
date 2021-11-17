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
    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User),
  },
});
