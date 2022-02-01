import { Character } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";
import {
  GiraffeqlInputFieldType,
  GiraffeqlInputType,
  GiraffeqlRootResolverType,
} from "giraffeql";

export default {
  ...generateBaseRootResolvers(Character, [
    "get",
    "getMultiple",
    "delete",
    "create",
    "update",
  ]),
  remapCharacter: new GiraffeqlRootResolverType({
    name: "remapCharacter",
    type: Character.typeDefLookup,
    allowNull: false,
    args: new GiraffeqlInputFieldType({
      required: true,
      type: new GiraffeqlInputType({
        name: "remapCharacterPayload",
        fields: {
          from: new GiraffeqlInputFieldType({
            type: Character.inputTypeDefLookup,
            allowNull: false,
            required: true,
          }),
          to: new GiraffeqlInputFieldType({
            type: Character.inputTypeDefLookup,
            allowNull: false,
            required: true,
          }),
        },
      }),
    }),
    resolver: (inputs) => Character.remapCharacter(inputs),
  }),
};
