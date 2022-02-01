import { GiraffeqlScalarType } from "giraffeql";

function validate(value: unknown) {
  if (typeof value !== "string") throw true;

  // 1-12 chars. cannot start/end with space or _-. OR (Unknown)
  if (
    !value.match(
      /^(?=^.{0,11}[^[\s\-_]]?$)([0-9a-zA-Z]+[0-9a-zA-Z\-\s_]*[0-9a-zA-Z]?|\(Unknown\))$/
    )
  )
    throw true;

  return value;
}

export const rsn = new GiraffeqlScalarType({
  name: "rsn",
  types: ["string"],
  description: "RSN Field",
  parseValue: validate,
  serialize: validate,
});
