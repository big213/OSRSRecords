import { User, ExternalLinkBackup, File } from "../../services";
import { GiraffeqlObjectType, ObjectTypeDefinition } from "giraffeql";
import {
  generateIdField,
  generateCreatedAtField,
  generateUpdatedAtField,
  generateCreatedByField,
  generateStringField,
  generateTypenameField,
  generateJoinableField,
} from "../../core/helpers/typeDef";

export default new GiraffeqlObjectType(<ObjectTypeDefinition>{
  name: ExternalLinkBackup.typename,
  description: "ExternalLinkBackup type",
  fields: {
    ...generateIdField(),
    ...generateTypenameField(ExternalLinkBackup),
    url: generateStringField({
      allowNull: false,
      sqlOptions: { unique: true },
    }),
    file: generateJoinableField({
      service: File,
      allowNull: false,
    }),
    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User),
  },
});
