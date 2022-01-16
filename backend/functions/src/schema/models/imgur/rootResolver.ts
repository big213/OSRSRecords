import { Imgur } from "../../services";
import * as Scalars from "../../scalars";
import {
  GiraffeqlInputFieldType,
  GiraffeqlInputType,
  GiraffeqlRootResolverType,
} from "giraffeql";

export default {
  getImgurData: new GiraffeqlRootResolverType({
    name: "getImgurData",
    restOptions: {
      method: "get",
      route: "/getImgurData",
    },
    type: Scalars.unknown,
    allowNull: false,
    args: new GiraffeqlInputFieldType({
      required: true,
      type: Scalars.string,
    }),
    resolver: (inputs) => Imgur.getImageData(inputs),
  }),

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
    resolver: (inputs) => Imgur.sendDiscordRequest(inputs),
  }),
};
