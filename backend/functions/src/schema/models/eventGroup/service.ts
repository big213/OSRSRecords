import { AccessControlMap } from "../../../types";
import { PaginatedService } from "../../core/services";

export class EventGroupService extends PaginatedService {
  defaultTypename = "eventGroup";

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
  };

  sortFieldsMap = {
    id: {},
    createdAt: {},
    updatedAt: {},
    name: {},
  };

  searchFieldsMap = {
    name: {},
  };

  accessControl: AccessControlMap = {
    get: () => true,
    getMultiple: () => true,
  };
}
