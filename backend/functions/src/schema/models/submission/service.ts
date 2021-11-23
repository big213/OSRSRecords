import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { permissionsCheck } from "../../core/helpers/permissions";
import { createObjectType } from "../../core/helpers/resolver";
import { PaginatedService } from "../../core/services";
import { sendDiscordMessage } from "../../helpers/discord";
import { File } from "../../services";
import { env } from "../../../config";

export class SubmissionService extends PaginatedService {
  defaultTypename = "submission";

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
    "event.id": {},
    "era.id": {},
    participants: {},
    status: {},
  };

  sortFieldsMap = {
    id: {},
    createdAt: {},
    updatedAt: {},
    score: {},
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
        score: validatedArgs.timeElapsed,
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
    sendDiscordMessage(env.discord.submissions_channel_url, {
      embeds: [
        {
          title: "New submission received",
          url: "https://osrsrecords.com/submissions?pageOptions=eyJzb3J0QnkiOlsiY3JlYXRlZEF0Il0sInNvcnREZXNjIjpbdHJ1ZV0sImZpbHRlcnMiOlt7ImZpZWxkIjoic3RhdHVzIiwib3BlcmF0b3IiOiJpbiIsInZhbHVlIjpbIlVOREVSX1JFVklFVyIsIlNVQk1JVFRFRCJdfV19",
          color: 15105570,
        },
      ],
    });

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
