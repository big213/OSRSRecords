import { submissionStatusKenum, userRoleKenum } from "./enums";
import { KenumService } from "./core/services";

import { UserService } from "./models/user/service";
import { ApiKeyService } from "./models/apiKey/service";
import { EraService } from "./models/era/service";
import { EventClassService } from "./models/eventClass/service";
import { EventGroupService } from "./models/eventGroup/service";
import { EventService } from "./models/event/service";
import { SubmissionService } from "./models/submission/service";
import { CharacterService } from "./models/character/service";
import { GithubService } from "./models/github/service";
import { FileService } from "./models/file/service";
import { DiscordChannelService } from "./models/discordChannel/service"
import { DiscordChannelOutputService } from "./models/discordChannelOutput/service"
/** END Service Import */

import { SubmissionCharacterParticipantLinkService } from "./links/submissionCharacterParticipantLink/service";
/** END LINK Service Import */

export const User = new UserService();
export const ApiKey = new ApiKeyService();
export const Era = new EraService();
export const EventClass = new EventClassService();
export const EventGroup = new EventGroupService();
export const Event = new EventService();
export const Submission = new SubmissionService();
export const Character = new CharacterService();
export const File = new FileService();
export const Github = new GithubService();
export const DiscordChannel = new DiscordChannelService();
export const DiscordChannelOutput = new DiscordChannelOutputService();
/** END Service Set */

export const SubmissionCharacterParticipantLink =
  new SubmissionCharacterParticipantLinkService(
    {
      submission: {
        service: Submission,
      },
      character: {
        service: Character,
      },
    },
    {
      submission: "submission",
      character: "character",
    },
    false
  );

/** END LINK Service Set */

export const UserRole = new KenumService("userRole", userRoleKenum);

export const SubmissionStatus = new KenumService(
  "submissionStatus",
  submissionStatusKenum
);
