import { EventClass } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers(EventClass, [
    "get",
    "getMultiple",
    "delete",
    "create",
    "update",
  ]),
};
