import { DiscordChannel } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers(DiscordChannel, [
    "get",
    "getMultiple",
    "delete",
    "create",
    "update",
  ]),
};
