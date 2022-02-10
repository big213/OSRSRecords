import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { permissionsCheck } from "../../core/helpers/permissions";
import { createObjectType } from "../../core/helpers/resolver";
import {
  deleteTableRow,
  fetchTableRows,
  updateTableRow,
} from "../../core/helpers/sql";
import { PaginatedService } from "../../core/services";
import { Submission, SubmissionCharacterParticipantLink } from "../../services";

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

  @permissionsCheck("remap")
  async remapCharacter({
    req,
    fieldPath,
    args,
    query,
    isAdmin = false,
    data = {},
  }: ServiceFunctionInputs) {
    const fromCharacter = await this.lookupRecord(["id"], args.from, fieldPath);

    const toCharacter = await this.lookupRecord(["id"], args.to, fieldPath);

    // get all submissions that have the from characterId
    const submissions = await fetchTableRows({
      select: ["id", "participantsList"],
      table: Submission.typename,
      where: {
        "submissionCharacterParticipantLink/character.id": fromCharacter.id,
      },
    });

    // update the submissions, replacing the from characterId
    for (const submission of submissions) {
      // loop through the participantsList array, replacing the from characterId with the to characterId
      submission.participantsList.forEach((participantObject) => {
        if (participantObject.characterId === fromCharacter.id) {
          participantObject.characterId = toCharacter.id;
        }
      });

      await updateTableRow({
        fields: {
          participantsList: submission.participantsList,
        },
        table: Submission.typename,
        where: {
          id: submission.id,
        },
      });
    }

    // update all references to from to to in submissionCharacterParticipantLink
    await updateTableRow({
      fields: {
        character: toCharacter.id,
      },
      table: SubmissionCharacterParticipantLink.typename,
      where: {
        character: fromCharacter.id,
      },
    });

    // deletes the from character
    await deleteTableRow({
      table: this.typename,
      where: {
        id: fromCharacter.id,
      },
    });

    return this.isEmptyQuery(query)
      ? {}
      : await this.getRecord({
          req,
          args: { id: toCharacter.id },
          query,
          fieldPath,
          isAdmin,
          data,
        });
  }

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
