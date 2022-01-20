import {
  User,
  DiscordChannelOutput,
  DiscordChannel,
  Event,
  EventEra,
} from "../../services";
import { GiraffeqlObjectType, ObjectTypeDefinition } from "giraffeql";
import {
  generateIdField,
  generateCreatedAtField,
  generateUpdatedAtField,
  generateCreatedByField,
  generateTypenameField,
  generateJoinableField,
  generateIntegerField,
  generateBooleanField,
  generateEnumField,
} from "../../core/helpers/typeDef";
import { Scalars } from "../..";

export default new GiraffeqlObjectType(<ObjectTypeDefinition>{
  name: DiscordChannelOutput.typename,
  description: "DiscordChannelOutput type",
  fields: {
    ...generateIdField(),
    ...generateTypenameField(DiscordChannelOutput),
    discordChannel: generateJoinableField({
      service: DiscordChannel,
      allowNull: false,
      sqlOptions: {
        field: "discord_channel",
      },
    }),
    event: generateJoinableField({
      service: Event,
      allowNull: false,
    }),
    participants: generateIntegerField({
      allowNull: true,
    }),
    eventEra: generateJoinableField({
      service: EventEra,
      allowNull: true,
      sqlOptions: { field: "event_era" },
    }),
    eventEraMode: generateEnumField({
      scalarDefinition: Scalars.eventEraMode,
      allowNull: false,
      defaultValue: "NORMAL",
      isKenum: true,
      sqlOptions: {
        field: "event_era_mode",
      },
    }),
    ranksToShow: generateIntegerField({
      allowNull: false,
      sqlOptions: {
        field: "ranks_to_show",
      },
      defaultValue: 1,
    }),
    isSoloPersonalBest: generateBooleanField({
      allowNull: true,
      sqlOptions: {
        field: "is_solo_personal_best",
      },
    }),
    sort: generateIntegerField({
      allowNull: false,
    }),
    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User),
  },
});
