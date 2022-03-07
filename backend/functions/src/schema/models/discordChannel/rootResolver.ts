import { DiscordChannel } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";
import { GiraffeqlInputFieldType, GiraffeqlRootResolverType } from "giraffeql";

export default {
  ...generateBaseRootResolvers({
    service: DiscordChannel,
    methods: ["get", "getMultiple", "delete", "create", "update"],
    restMethods: ["get", "getMultiple"],
  }),
  // forces refresh of the discord channel specified
  refreshDiscordChannel: new GiraffeqlRootResolverType({
    name: "refreshDiscordChannel",
    restOptions: {
      method: "post",
      route: "/refreshDiscordChannel",
    },
    allowNull: false,
    type: DiscordChannel.typeDefLookup,
    args: new GiraffeqlInputFieldType({
      required: true,
      type: DiscordChannel.inputTypeDefLookup,
    }),
    resolver: (inputs) => DiscordChannel.refreshDiscordChannelMessage(inputs),
  }),
};
