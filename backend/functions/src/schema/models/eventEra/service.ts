import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { permissionsCheck } from "../../core/helpers/permissions";
import {
  createObjectType,
  updateObjectType,
} from "../../core/helpers/resolver";
import { PaginatedService } from "../../core/services";
import { Submission } from "../../services";

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
  async addEventEra({
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

    const currentEventEra = await this.getFirstSqlRecord(
      {
        select: ["id", "beginDate"],
        where: {
          isCurrent: true,
          "event.id": validatedArgs.event,
        },
      },
      fieldPath,
      false
    );

    // check if beginDate of new era is before the current era (if any)
    if (
      currentEventEra &&
      validatedArgs.beginDate <= currentEventEra.beginDate
    ) {
      throw new Error(
        `beginDate must be greater than the current event era's beginDate`
      );
    }

    // set the current era (if any) to isCurrent = false, and set the endDate
    if (currentEventEra) {
      await this.updateSqlRecord(
        {
          fields: {
            isCurrent: false,
            name: validatedArgs.previousEventEraName,
            endDate: validatedArgs.beginDate,
          },
          where: {
            id: currentEventEra,
          },
        },
        fieldPath
      );
    }

    // create the current era
    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(fieldPath),
        name: "Current Era",
        beginDate: validatedArgs.beginDate,
        isBuff: validatedArgs.isBuff,
        isRelevant: true,
        isCurrent: true,
        createdBy: req.user!.id,
      },
      req,
      fieldPath,
    });

    // sync the isRelevant status (if it was a nerf, this would potentially change things)
    if (validatedArgs.isBuff === false) {
      await this.syncIsRelevantStatus(validatedArgs.event);
    }

    // if there are any submissions that happened after beginDate, set the era to current era
    await Submission.updateSqlRecord(
      {
        fields: {
          eventEra: addResults.id,
        },
        where: [
          {
            field: "happenedOn",
            operator: "gte",
            value: validatedArgs.beginDate,
          },
        ],
      },
      fieldPath
    );

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

  // no longer allowed -- use addEventEra instead
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
    const previousCurrentCount = await this.countSqlRecord(
      {
        where: { isCurrent: true, "event.id": validatedArgs.event },
      },
      fieldPath
    );

    // if any previous current eventEras with the same event.id, set all to false
    if (previousCurrentCount > 0) {
      await this.updateSqlRecord({
        fields: {
          isCurrent: false,
        },
        where: {
          isCurrent: true,
          event: validatedArgs.event,
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

    const item = await this.getFirstSqlRecord(
      {
        select: ["id", "event.id", "isBuff"],
        where: validatedArgs.item,
      },
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
    // (no longer allowing this to be updated)
    /*
    if (
      validatedArgs.fields.isBuff !== undefined &&
      item.isBuff !== validatedArgs.fields.isBuff
    ) {
      await this.syncIsRelevantStatus(item["event.id"]);
    }
    */

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
    const results = await this.getAllSqlRecord({
      select: ["beginDate"],
      where: {
        isBuff: false,
        "event.id": eventId,
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

    // if there was a recent nerf, set all eras after begin date as isRelevant = true
    if (mostRecentNerfBeginDate) {
      await this.updateSqlRecord({
        fields: {
          isRelevant: true,
        },
        where: [
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
      });

      // if there was a recent nerf, get all eventEras lte begin date
      const irrelevantEras = await this.getAllSqlRecord({
        select: ["id", "isRelevant"],
        where: [
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
      });

      // for each irrelevant era, set isRelevant to false (if not already)
      for (const eventEra of irrelevantEras) {
        if (eventEra.isRelevant !== false) {
          await this.updateSqlRecord({
            fields: {
              isRelevant: false,
            },
            where: {
              id: eventEra.id,
            },
          });

          // also set all submissions belonging to the newly irrelevant era as isRelevantRecord = false
          await Submission.updateSqlRecord({
            fields: {
              isRelevantRecord: false,
            },
            where: {
              eventEra: eventEra.id,
            },
          });
        }
      }
    } else {
      // if no most recent nerfed eventEra, all eventEras should be isRelevant = true
      await this.updateSqlRecord({
        fields: {
          isRelevant: true,
        },
        where: {
          event: eventId,
        },
      });
    }
  }
}
