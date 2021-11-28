import { User, Event, EventClass, EventGroup } from "../../services";
import { GiraffeqlObjectType, ObjectTypeDefinition } from "giraffeql";
import {
  generateIdField,
  generateCreatedAtField,
  generateUpdatedAtField,
  generateCreatedByField,
  generateTextField,
  generateTypenameField,
  generateJoinableField,
  generateIntegerField,
  generateBooleanField,
  generateStringField,
  generateUnixTimestampField,
} from "../../core/helpers/typeDef";

export default new GiraffeqlObjectType(<ObjectTypeDefinition>{
  name: Event.typename,
  description: "Event type",
  fields: {
    ...generateIdField(),
    ...generateTypenameField(Event),
    eventClass: generateJoinableField({
      service: EventClass,
      allowNull: false,
      sqlOptions: {
        field: "event_class",
        unique: "compositeKey",
      },
    }),
    eventGroup: generateJoinableField({
      service: EventGroup,
      allowNull: false,
      sqlOptions: {
        field: "event_group",
      },
    }),
    minParticipants: generateIntegerField({
      allowNull: true,
      sqlOptions: {
        field: "min_participants",
      },
    }),
    maxParticipants: generateIntegerField({
      allowNull: true,
      sqlOptions: {
        field: "max_participants",
      },
    }),
    releaseDate: generateUnixTimestampField({
      allowNull: false,
      sqlOptions: {
        field: "release_date",
      },
    }),
    avatar: generateStringField({ allowNull: true }),
    backgroundImage: generateStringField({
      allowNull: true,
      sqlOptions: { field: "background_image" },
    }),
    name: generateStringField({
      allowNull: false,
    }),
    description: generateTextField({
      allowNull: true,
    }),
    isHardMode: generateBooleanField({
      allowNull: false,
      sqlOptions: { field: "is_hard_mode", unique: "compositeKey" },
    }),
    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User),
  },
});
