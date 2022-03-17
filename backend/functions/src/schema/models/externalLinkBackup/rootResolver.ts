import { ExternalLinkBackup } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers({
    service: ExternalLinkBackup,
    methods: ["get", "getMultiple", "delete", "create", "update"],
  }),
};
