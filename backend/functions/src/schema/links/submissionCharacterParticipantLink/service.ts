import { LinkService } from "../../core/services";
import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { permissionsCheck } from "../../core/helpers/permissions";
import { createObjectType } from "../../core/helpers/resolver";
import { countTableRows, updateTableRow } from "../../core/helpers/sql";
import { Submission } from "../../services";

export class SubmissionCharacterParticipantLinkService extends LinkService {
  defaultTypename = "submissionCharacterParticipantLink";

  filterFieldsMap = {
    "submission.id": {},
    "character.id": {},
  };

  uniqueKeyMap = {
    primary: ["id"],
    secondary: ["submission", "character"],
  };

  sortFieldsMap = {
    createdAt: {},
  };

  searchFieldsMap = {};

  groupByFieldsMap = {};

  accessControl: AccessControlMap = {
    get: () => true,
    getMultiple: () => true,
    // ideally this should not be allowed, but it is a temporary solution
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

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(fieldPath),
        ...validatedArgs,
        createdBy: req.user?.id, // nullable
      },
      req,
      fieldPath,
    });

    // changed: need to sync participants count on submission
    // get number of participants
    const participantsCount = await countTableRows({
      from: this.typename,
      where: {
        fields: [
          {
            field: "submission",
            operator: "eq",
            value: validatedArgs.submission,
          },
        ],
      },
    });

    // sync the submission record
    await updateTableRow({
      fields: {
        participants: participantsCount,
      },
      table: Submission.typename,
      where: {
        fields: [
          {
            field: "id",
            operator: "eq",
            value: validatedArgs.submission,
          },
        ],
      },
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
