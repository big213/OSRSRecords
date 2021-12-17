import { User, Event, EventClass } from "../../services";
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
  generateStringField,
  generateUnixTimestampField,
  generateEnumField,
} from "../../core/helpers/typeDef";
import * as Scalars from "../../scalars";

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
    avatarOverride: generateStringField({
      allowNull: true,
      sqlOptions: { field: "avatar_override" },
    }),
    avatar: {
      type: Scalars.string,
      requiredSqlFields: ["avatarOverride", "eventClass.avatar"],
      allowNull: true,
      resolver({ parentValue }) {
        return (
          parentValue.avatarOverride ?? parentValue.eventClass?.avatar ?? null
        );
      },
    },
    backgroundImageOverride: generateStringField({
      allowNull: true,
      sqlOptions: { field: "background_image_override" },
    }),
    backgroundImage: {
      type: Scalars.string,
      requiredSqlFields: [
        "backgroundImageOverride",
        "eventClass.backgroundImage",
      ],
      allowNull: true,
      resolver({ parentValue }) {
        return (
          parentValue.backgroundImageOverride ??
          parentValue.eventClass?.backgroundImage ??
          null
        );
      },
    },
    name: generateStringField({
      allowNull: false,
    }),
    description: generateTextField({
      allowNull: true,
    }),
    difficulty: generateEnumField({
      scalarDefinition: Scalars.eventDifficulty,
      allowNull: false,
      defaultValue: "NORMAL",
      isKenum: true,
      sqlOptions: { unique: "compositeKey" },
    }),
    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User),
  },
});
