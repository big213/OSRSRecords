import { EventEra } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers(EventEra, [
    "get",
    "getMultiple",
    "delete",
    "create",
    "update",
  ]),
};
