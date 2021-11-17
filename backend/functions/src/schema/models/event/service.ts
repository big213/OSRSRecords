import { AccessControlMap } from "../../../types";
import { PaginatedService } from "../../core/services";

export class EventService extends PaginatedService {
  defaultTypename = "event";

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
  };

  sortFieldsMap = {
    id: {},
    createdAt: {},
    updatedAt: {},
  };

  searchFieldsMap = {
    name: {},
  };

  accessControl: AccessControlMap = {};
}
