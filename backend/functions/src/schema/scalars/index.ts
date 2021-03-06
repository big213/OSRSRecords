import {
  generateKenumScalarDefinition,
  generateEnumScalarDefinition,
} from "../core/helpers/scalar";
import {
  userRoleKenum,
  submissionStatusKenum,
  userPermissionEnum,
  eventDifficultyKenum,
  eventEraModeKenum,
} from "../enums";

import { BaseScalars, GiraffeqlScalarType } from "giraffeql";

// base scalars
export const string = BaseScalars.string;
// export const number = BaseScalars.number;
export const boolean = BaseScalars.boolean;
export const unknown = BaseScalars.unknown;

// added scalars
export { number } from "./number"; // replacing the built-in number type to automatically parse Number-like strings
export { imageUrl } from "./imageUrl";
export { url } from "./url";
export { unixTimestamp } from "./unixTimestamp";
export { date } from "./date";
export { id } from "./id";
export { regex } from "./regex";
export { json } from "./json";
export { jsonString } from "./jsonString";

export { rsn } from "./rsn";

// generated scalars
export const submissionStatus = new GiraffeqlScalarType(
  generateKenumScalarDefinition("submissionStatus", submissionStatusKenum)
);

export const eventDifficulty = new GiraffeqlScalarType(
  generateKenumScalarDefinition("eventDifficulty", eventDifficultyKenum)
);

export const userRole = new GiraffeqlScalarType(
  generateKenumScalarDefinition("userRole", userRoleKenum)
);

export const userPermission = new GiraffeqlScalarType(
  generateEnumScalarDefinition("userPermission", userPermissionEnum)
);

export const eventEraMode = new GiraffeqlScalarType(
  generateKenumScalarDefinition("eventEraMode", eventEraModeKenum)
);
