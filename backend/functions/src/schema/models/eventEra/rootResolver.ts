import { Event, EventEra } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";
import {
  GiraffeqlInputFieldType,
  GiraffeqlInputType,
  GiraffeqlRootResolverType,
} from "giraffeql";
import * as Scalars from "../../scalars";

export default {
  ...generateBaseRootResolvers({
    service: EventEra,
    // create is not allowed, use add instead
    // delete currently not allowed
    methods: ["get", "getMultiple", "update"],
    restMethods: ["get", "getMultiple"],
  }),
  addEventEra: new GiraffeqlRootResolverType({
    name: "addEventEra",
    restOptions: {
      method: "post",
      route: "/addEventEra",
    },
    type: EventEra.typeDefLookup,
    allowNull: false,
    args: new GiraffeqlInputFieldType({
      required: true,
      type: new GiraffeqlInputType({
        name: "solveGenerateArgs",
        fields: {
          event: new GiraffeqlInputFieldType({
            required: true,
            type: Event.inputTypeDefLookup,
          }),
          previousEventEraName: new GiraffeqlInputFieldType({
            required: true,
            type: Scalars.string,
          }),
          beginDate: new GiraffeqlInputFieldType({
            required: true,
            type: Scalars.unixTimestamp,
          }),
          isBuff: new GiraffeqlInputFieldType({
            required: true,
            allowNull: true,
            type: Scalars.boolean,
          }),
        },
      }),
    }),
    resolver: (inputs) => EventEra.addEventEra(inputs),
  }),
};
