import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { permissionsCheck } from "../../core/helpers/permissions";
import { createObjectType } from "../../core/helpers/resolver";
import { PaginatedService } from "../../core/services";
import { File } from "../../services";

export class SubmissionService extends PaginatedService {
  defaultTypename = "submission";

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
  };

  sortFieldsMap = {
    id: {},
    createdAt: {},
    updatedAt: {},
  };

  searchFieldsMap = {
    name: {},
  };

  accessControl: AccessControlMap = {};

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

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(fieldPath),
        ...validatedArgs,
        score: 123,
        createdBy: req.user!.id,
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

  async afterCreateProcess(
    { req, fieldPath, args }: ServiceFunctionInputs,
    itemId: string
  ) {
    return File.updateFileParentKeys(
      req.user!.id,
      this.typename,
      itemId,
      [args.files],
      fieldPath
    );
  }

  async afterUpdateProcess(
    { req, fieldPath, args }: ServiceFunctionInputs,
    itemId: string
  ) {
    return File.updateFileParentKeys(
      req.user!.id,
      this.typename,
      itemId,
      [args.fields.files],
      fieldPath
    );
  }
}
