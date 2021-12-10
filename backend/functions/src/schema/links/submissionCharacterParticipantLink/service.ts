import { LinkService } from "../../core/services";
import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { permissionsCheck } from "../../core/helpers/permissions";
import { createObjectType } from "../../core/helpers/resolver";
import { countTableRows, updateTableRow } from "../../core/helpers/sql";
import { Submission } from "../../services";
import { submissionStatusKenum } from "../../enums";
import { GiraffeqlBaseError } from "giraffeql";

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

    // changed: check the status of the submission
    const submission = await Submission.lookupRecord(
      ["status", "participants", "event.maxParticipants"],
      {
        id: validatedArgs.submission,
      },
      fieldPath,
      false
    );

    // if the status is APPROVED, don't allow adding of more links
    if (
      submissionStatusKenum.fromUnknown(submission.status) ===
      submissionStatusKenum.APPROVED
    ) {
      throw new GiraffeqlBaseError({
        message: "Cannot add more participant links to an approved submission",
        fieldPath,
      });
    }

    // make sure the number of participants is not already >= event.maxParticipants
    if (
      submission["event.maxParticipants"] &&
      submission.participants >= submission["event.maxParticipants"]
    ) {
      throw new GiraffeqlBaseError({
        message:
          "The number of participants on this submission is already greater than or equal to the maximum participants allowed for the event",
        fieldPath,
      });
    }

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
