import { User, EventClass, EventGroup } from "../../services";
import { GiraffeqlObjectType, ObjectTypeDefinition } from "giraffeql";
import {
  generateIdField,
  generateCreatedAtField,
  generateUpdatedAtField,
  generateCreatedByField,
  generateTypenameField,
  generateJoinableField,
  generateStringField,
} from "../../core/helpers/typeDef";

export default new GiraffeqlObjectType(<ObjectTypeDefinition>{
  name: EventGroup.typename,
  description: "EventGroup type",
  fields: {
    ...generateIdField(),
    ...generateTypenameField(EventGroup),
    eventClass: generateJoinableField({
      service: EventClass,
      allowNull: false,
      sqlOptions: {
        field: "event_class",
      },
    }),
    avatar: generateStringField({ allowNull: true }),
    name: generateStringField({
      allowNull: false,
    }),
    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User),
  },
});
