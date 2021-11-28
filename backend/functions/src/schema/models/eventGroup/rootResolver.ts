import { EventGroup } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers(EventGroup, [
    "get",
    "getMultiple",
    "delete",
    "create",
    "update",
  ]),
};
