import { Era } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers(Era, [
    "get",
    "getMultiple",
    "delete",
    "create",
    "update",
  ]),
};
