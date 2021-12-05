import { DiscordChannelOutput } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers(DiscordChannelOutput, [
    "get",
    "getMultiple",
    "delete",
    "create",
    "update",
  ]),
};
