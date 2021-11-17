import { Submission } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers(Submission, [
    "get",
    "getMultiple",
    "delete",
    "create",
    "update",
  ]),
};
