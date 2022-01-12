import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { permissionsCheck } from "../../core/helpers/permissions";
import {
  createObjectType,
  updateObjectType,
} from "../../core/helpers/resolver";
import { fetchTableRows, updateTableRow } from "../../core/helpers/sql";
import { PaginatedService } from "../../core/services";

export class EventEraService extends PaginatedService {
  defaultTypename = "eventEra";

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
    "event.id": {},
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

    // check if any previous era that is current with the same event.id
    const previousCurrentCount = await this.getRecordCount(
      {
        fields: [
          {
            field: "isCurrent",
            operator: "eq",
            value: true,
          },
          {
            field: "event.id",
            operator: "eq",
            value: validatedArgs.event,
          },
        ],
      },
      fieldPath
    );

    // if any previous current eventEras with the same event.id, set all to false
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
            {
              field: "event",
              operator: "eq",
              value: validatedArgs.event,
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
        isRelevant: true,
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

  @permissionsCheck("update")
  async updateRecord({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // args should be validated already
    const validatedArgs = <any>args;

    const item = await this.lookupRecord(
      ["id", "event.id", "isBuff"],
      validatedArgs.item,
      fieldPath
    );

    // convert any lookup/joined fields into IDs
    await this.handleLookupArgs(validatedArgs.fields, fieldPath);

    await updateObjectType({
      typename: this.typename,
      id: item.id,
      updateFields: {
        ...validatedArgs.fields,
        updatedAt: 1,
      },
      req,
      fieldPath,
    });

    // changed: sync the isRelevant statuses IF isBuff was updated
    if (
      validatedArgs.fields.isBuff !== undefined &&
      item.isBuff !== validatedArgs.fields.isBuff
    ) {
      await this.syncIsRelevantStatus(item["event.id"]);
    }

    // do post-update fn, if any
    await this.afterUpdateProcess(
      {
        req,
        fieldPath,
        args,
        query,
        data,
        isAdmin,
      },
      item.id
    );

    return this.isEmptyQuery(query)
      ? {}
      : await this.getRecord({
          req,
          args: { id: item.id },
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
    await this.syncIsRelevantStatus(args.event);
  }

  async syncIsRelevantStatus(eventId: string) {
    // get the beginDate of the most recent nerf, if any
    const results = await fetchTableRows({
      select: [
        {
          field: "beginDate",
        },
      ],
      from: this.typename,
      where: {
        fields: [
          {
            field: "isBuff",
            value: false,
          },
          {
            field: "event.id",
            value: eventId,
          },
        ],
      },
      orderBy: [
        {
          field: "beginDate",
          desc: true,
        },
      ],
      limit: 1,
    });

    const mostRecentNerfBeginDate = results[0]?.beginDate;

    // if there was a recent nerf, set all records after begin date as isRelevant = true
    if (mostRecentNerfBeginDate) {
      await updateTableRow({
        fields: {
          isRelevant: true,
        },
        table: this.typename,
        where: {
          fields: [
            {
              field: "beginDate",
              operator: "gt",
              value: mostRecentNerfBeginDate,
            },
            {
              field: "event",
              value: eventId,
            },
          ],
        },
      });

      // if there was a recent nerf, set all records lte begin date as isRelevant = false
      await updateTableRow({
        fields: {
          isRelevant: false,
        },
        table: this.typename,
        where: {
          fields: [
            {
              field: "beginDate",
              operator: "lte",
              value: mostRecentNerfBeginDate,
            },
            {
              field: "event",
              value: eventId,
            },
          ],
        },
      });
    }
  }
}
