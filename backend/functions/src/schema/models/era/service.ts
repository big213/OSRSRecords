import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { permissionsCheck } from "../../core/helpers/permissions";
import { createObjectType } from "../../core/helpers/resolver";
import { fetchTableRows, updateTableRow } from "../../core/helpers/sql";
import { PaginatedService } from "../../core/services";

export class EraService extends PaginatedService {
  defaultTypename = "era";

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
  };

  sortFieldsMap = {
    id: {},
    createdAt: {},
    updatedAt: {},
    beginDate: {},
  };

  searchFieldsMap = {
    name: {},
  };

  accessControl: AccessControlMap = {
    get: () => true,
    getMultiple: () => true,
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

    // check if any previous era that is current
    const previousCurrentCount = await this.getRecordCount(
      {
        fields: [
          {
            field: "isCurrent",
            operator: "eq",
            value: true,
          },
        ],
      },
      fieldPath
    );

    // if any previous current era, set all to false
    if (previousCurrentCount > 0) {
      await updateTableRow({
        fields: {
          isCurrent: false,
        },
        table: this.typename,
        where: {
          fields: [
            {
              field: "isCurrent",
              operator: "eq",
              value: true,
            },
          ],
        },
      });
    }

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(fieldPath),
        ...validatedArgs,
        isCurrent: true, // set the isCurrent to true
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
}
