import { Imgur } from "../../services";
import * as Scalars from "../../scalars";
import { GiraffeqlInputFieldType, GiraffeqlRootResolverType } from "giraffeql";

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
};
