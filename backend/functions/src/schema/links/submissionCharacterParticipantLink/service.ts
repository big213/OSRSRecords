import { LinkService } from "../../core/services";
import { AccessControlMap } from "../../../types";

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
  };
}
