import { SubmissionCharacterParticipantLink } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers({
    service: SubmissionCharacterParticipantLink,
    methods: ["get", "getMultiple", "delete", "create", "update"],
  }),
};
