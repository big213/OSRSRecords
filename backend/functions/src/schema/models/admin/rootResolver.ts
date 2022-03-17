import { Admin } from "../../services";
import * as Scalars from "../../scalars";
import {
  GiraffeqlInputFieldType,
  GiraffeqlInputType,
  GiraffeqlRootResolverType,
} from "giraffeql";

export default {
  sendDiscordRequest: new GiraffeqlRootResolverType({
    name: "sendDiscordRequest",
    type: Scalars.unknown,
    allowNull: false,
    args: new GiraffeqlInputFieldType({
      required: true,
      type: new GiraffeqlInputType({
        name: "discordRequestPayload",
        fields: {
          method: new GiraffeqlInputFieldType({
            type: Scalars.string,
            required: true,
          }),
          path: new GiraffeqlInputFieldType({
            type: Scalars.string,
            required: true,
          }),
          params: new GiraffeqlInputFieldType({
            type: Scalars.unknown,
            allowNull: true,
          }),
        },
      }),
    }),
    resolver: (inputs) => Admin.sendDiscordRequest(inputs),
  }),

  executeAdminFunction: new GiraffeqlRootResolverType({
    name: "executeAdminFunction",
    restOptions: {
      method: "get",
      route: "/executeAdminFunction",
    },
    type: Scalars.unknown,
    allowNull: false,
    args: new GiraffeqlInputFieldType({
      required: true,
      allowNull: true,
      type: Scalars.string,
    }),
    resolver: (inputs) => Admin.executeAdminFunction(inputs),
  }),
};
