import { SubmissionCharacterParticipantLink } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers(SubmissionCharacterParticipantLink, [
    "get",
    "getMultiple",
    "update",
    "delete",
    "create",
  ]),
};
