import { AccessControlMap } from "../../../types";
import { PaginatedService } from "../../core/services";

export class EventService extends PaginatedService {
  defaultTypename = "event";

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
    "eventClass.id": {},
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
