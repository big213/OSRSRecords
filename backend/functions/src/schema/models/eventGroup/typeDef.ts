import { User, EventGroup } from "../../services";
import { GiraffeqlObjectType, ObjectTypeDefinition } from "giraffeql";
import {
  generateIdField,
  generateCreatedAtField,
  generateUpdatedAtField,
  generateCreatedByField,
  generateTypenameField,
  generateStringField,
  generateArrayField,
  generateIntegerField,
} from "../../core/helpers/typeDef";
import { Scalars } from "../..";

export default new GiraffeqlObjectType(<ObjectTypeDefinition>{
  name: EventGroup.typename,
  description: "EventGroup type",
  fields: {
    ...generateIdField(),
    ...generateTypenameField(EventGroup),
    avatar: generateStringField({ allowNull: true }),
    name: generateStringField({
      allowNull: false,
    }),
    contents: generateArrayField({
      allowNull: false,
      type: Scalars.id,
    }),
    sort: generateIntegerField({
      allowNull: false,
    }),
    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User),
  },
});
