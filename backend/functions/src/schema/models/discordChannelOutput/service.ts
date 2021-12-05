import { AccessControlMap } from "../../../types";
import { PaginatedService } from "../../core/services";

export class DiscordChannelOutputService extends PaginatedService {
  defaultTypename = "discordChannelOutput";

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
    "discordChannel.id": {},
  };

  sortFieldsMap = {
    id: {},
    createdAt: {},
    updatedAt: {},
    sort: {},
  };

  searchFieldsMap = {
    name: {},
  };

  accessControl: AccessControlMap = {};
}
