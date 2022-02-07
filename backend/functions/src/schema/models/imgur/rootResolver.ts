import { Imgur } from "../../services";
import * as Scalars from "../../scalars";
import { GiraffeqlInputFieldType, GiraffeqlRootResolverType } from "giraffeql";

export default {
  getImgurImage: new GiraffeqlRootResolverType({
    name: "getImgurImage",
    restOptions: {
      method: "get",
      route: "/getImgurImage",
    },
    type: Scalars.unknown,
    allowNull: false,
    args: new GiraffeqlInputFieldType({
      required: true,
      type: Scalars.string,
    }),
    resolver: (inputs) => Imgur.getImageData(inputs),
  }),

  getImgurAlbum: new GiraffeqlRootResolverType({
    name: "getImgurAlbum",
    restOptions: {
      method: "get",
      route: "/getImgurAlbum",
    },
    type: Scalars.unknown,
    allowNull: false,
    args: new GiraffeqlInputFieldType({
      required: true,
      type: Scalars.string,
    }),
    resolver: (inputs) => Imgur.getAlbumData(inputs),
  }),
};
