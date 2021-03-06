import * as allServices from "./services";
import "./scalars"; // initialize scalars
export * as Scalars from "./scalars";

import user from "./models/user/typeDef";
import apiKey from "./models/apiKey/typeDef";
import eventClass from "./models/eventClass/typeDef";
import eventGroup from "./models/eventGroup/typeDef";
import event from "./models/event/typeDef";
import submission from "./models/submission/typeDef";
import character from "./models/character/typeDef";
import file from "./models/file/typeDef";
import discordChannel from "./models/discordChannel/typeDef";
import discordChannelOutput from "./models/discordChannelOutput/typeDef";
import eventEra from "./models/eventEra/typeDef";
import externalLinkBackup from "./models/externalLinkBackup/typeDef"
/** END TypeDef Import */

import submissionCharacterParticipantLink from "./links/submissionCharacterParticipantLink/typeDef";
import userUserFollowLink from "./links/userUserFollowLink/typeDef";
/** END LINK TypeDef Import */

// add the objectTypeDefs for the services with objectTypeDefs
allServices.User.setTypeDef(user);
allServices.ApiKey.setTypeDef(apiKey);
allServices.EventClass.setTypeDef(eventClass);
allServices.EventGroup.setTypeDef(eventGroup);
allServices.Event.setTypeDef(event);
allServices.Submission.setTypeDef(submission);
allServices.Character.setTypeDef(character);
allServices.File.setTypeDef(file);
allServices.DiscordChannel.setTypeDef(discordChannel);
allServices.DiscordChannelOutput.setTypeDef(discordChannelOutput);
allServices.EventEra.setTypeDef(eventEra);
allServices.ExternalLinkBackup.setTypeDef(externalLinkBackup)
/** END TypeDef Set */

allServices.SubmissionCharacterParticipantLink.setTypeDef(
  submissionCharacterParticipantLink
);
allServices.UserUserFollowLink.setTypeDef(userUserFollowLink);
/** END LINK TypeDef Set */

import User from "./models/user/rootResolver";
import ApiKey from "./models/apiKey/rootResolver";
import EventClass from "./models/eventClass/rootResolver";
import EventGroup from "./models/eventGroup/rootResolver";
import Event from "./models/event/rootResolver";
import Submission from "./models/submission/rootResolver";
import Character from "./models/character/rootResolver";
import Github from "./models/github/rootResolver";
import File from "./models/file/rootResolver";
import DiscordChannel from "./models/discordChannel/rootResolver";
import DiscordChannelOutput from "./models/discordChannelOutput/rootResolver";
import EventEra from "./models/eventEra/rootResolver";
import Imgur from "./models/imgur/rootResolver";
import Admin from "./models/admin/rootResolver";
import ExternalLinkBackup from "./models/externalLinkBackup/rootResolver"
/** END RootResolver Import */

import SubmissionCharacterParticipantLink from "./links/submissionCharacterParticipantLink/rootResolver";
import UserUserFollowLink from "./links/userUserFollowLink/rootResolver";
/** END LINK RootResolver Import */

allServices.User.setRootResolvers(User);
allServices.ApiKey.setRootResolvers(ApiKey);
allServices.EventClass.setRootResolvers(EventClass);
allServices.EventGroup.setRootResolvers(EventGroup);
allServices.Event.setRootResolvers(Event);
allServices.Submission.setRootResolvers(Submission);
allServices.Character.setRootResolvers(Character);
allServices.Github.setRootResolvers(Github);
allServices.File.setRootResolvers(File);
allServices.DiscordChannel.setRootResolvers(DiscordChannel);
allServices.DiscordChannelOutput.setRootResolvers(DiscordChannelOutput);
allServices.EventEra.setRootResolvers(EventEra);
allServices.Imgur.setRootResolvers(Imgur);
allServices.Admin.setRootResolvers(Admin);
allServices.ExternalLinkBackup.setRootResolvers(ExternalLinkBackup);
/** END RootResolver Set */

allServices.SubmissionCharacterParticipantLink.setRootResolvers(
  SubmissionCharacterParticipantLink
);
allServices.UserUserFollowLink.setRootResolvers(UserUserFollowLink);
/** END LINK RootResolver Set */
