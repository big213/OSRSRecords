import { Submission } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";
import { GiraffeqlRootResolverType } from "giraffeql";
import { Scalars } from "../..";

export default {
  ...generateBaseRootResolvers({
    service: Submission,
    methods: ["get", "getMultiple", "delete", "create", "update"],
    restMethods: ["get", "getMultiple"],
  }),

  checkSubmissions: new GiraffeqlRootResolverType({
    name: "checkSubmissions",
    type: Scalars.number,
    allowNull: false,
    resolver: (inputs) => Submission.checkSubmissions(inputs),
  }),
};
