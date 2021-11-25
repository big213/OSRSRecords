import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { permissionsCheck } from "../../core/helpers/permissions";
import { createObjectType } from "../../core/helpers/resolver";
import { PaginatedService } from "../../core/services";

export class CharacterService extends PaginatedService {
  defaultTypename = "character";

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
    "submissionCharacterParticipantLink/character.id": {},
  };

  sortFieldsMap = {
    id: {},
    createdAt: {},
    updatedAt: {},
  };

  searchFieldsMap = {
    name: {},
  };

  accessControl: AccessControlMap = {
    get: () => true,
    getMultiple: () => true,
    create: () => true,
  };

  @permissionsCheck("create")
  async createRecord({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // args should be validated already
    const validatedArgs = <any>args;
    await this.handleLookupArgs(args, fieldPath);

    // changed: check for existence of standardizedName
    const existingCharacter = await this.lookupRecord(
      ["id"],
      {
        standardizedName: validatedArgs.name.toLowerCase(),
      },
      fieldPath,
      false
    );

    // if the record exists, cut short and return it
    if (existingCharacter) {
      return this.isEmptyQuery(query)
        ? {}
        : await this.getRecord({
            req,
            args: { id: existingCharacter.id },
            query,
            fieldPath,
            isAdmin,
            data,
          });
    }

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(fieldPath),
        ...validatedArgs,
        // changed: used to index
        standardizedName: validatedArgs.name.toLowerCase(),
        createdBy: req.user?.id, // nullable
      },
      req,
      fieldPath,
    });

    // do post-create fn, if any
    await this.afterCreateProcess(
      {
        req,
        fieldPath,
        args,
        query,
        data,
        isAdmin,
      },
      addResults.id
    );

    return this.isEmptyQuery(query)
      ? {}
      : await this.getRecord({
          req,
          args: { id: addResults.id },
          query,
          fieldPath,
          isAdmin,
          data,
        });
  }
}
