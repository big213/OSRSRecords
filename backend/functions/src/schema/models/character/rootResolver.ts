import { Character } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers(Character, [
    "get",
    "getMultiple",
    "delete",
    "create",
    "update",
  ]),
};
