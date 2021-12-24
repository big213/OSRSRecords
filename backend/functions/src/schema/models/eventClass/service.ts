import { AccessControlMap } from "../../../types";
import { PaginatedService } from "../../core/services";

export class EventClassService extends PaginatedService {
  defaultTypename = "eventClass";

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
    "parent.id": {},
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

  accessControl: AccessControlMap = {};
}
