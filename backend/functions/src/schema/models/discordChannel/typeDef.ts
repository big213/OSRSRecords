import { User, DiscordChannel } from "../../services";
import { GiraffeqlObjectType, ObjectTypeDefinition } from "giraffeql";
import {
  generateIdField,
  generateCreatedAtField,
  generateUpdatedAtField,
  generateCreatedByField,
  generateStringField,
  generateTypenameField,
} from "../../core/helpers/typeDef";

export default new GiraffeqlObjectType(<ObjectTypeDefinition>{
  name: DiscordChannel.typename,
  description: "DiscordChannel type",
  fields: {
    ...generateIdField(),
    ...generateTypenameField(DiscordChannel),
    name: generateStringField({ allowNull: false }),
    channelId: generateStringField({
      allowNull: false,
      sqlOptions: { field: "channel_id" },
    }),
    primaryMessageId: generateStringField({
      allowNull: true,
      sqlOptions: { field: "primary_message_id" },
    }),
    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User),
  },
});
