import { AccessControlMap } from "../../../types";
import { PaginatedService } from "../../core/services";

export class EventClassService extends PaginatedService {
  defaultTypename = "eventClass";

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
