import * as allServices from "./services";
import "./scalars"; // initialize scalars
export * as Scalars from "./scalars";

import user from "./models/user/typeDef";
import apiKey from "./models/apiKey/typeDef";
import era from "./models/era/typeDef";
import eventClass from "./models/eventClass/typeDef";
import eventGroup from "./models/eventGroup/typeDef";
import event from "./models/event/typeDef";
import submission from "./models/submission/typeDef";
import character from "./models/character/typeDef";
import file from "./models/file/typeDef";

import submissionCharacterParticipantLink from "./links/submissionCharacterParticipantLink/typeDef";

// add the objectTypeDefs for the services with objectTypeDefs
allServices.User.setTypeDef(user);
allServices.ApiKey.setTypeDef(apiKey);
allServices.Era.setTypeDef(era);
allServices.EventClass.setTypeDef(eventClass);
allServices.EventGroup.setTypeDef(eventGroup);
allServices.Event.setTypeDef(event);
allServices.Submission.setTypeDef(submission);
allServices.Character.setTypeDef(character);
allServices.File.setTypeDef(file);

allServices.SubmissionCharacterParticipantLink.setTypeDef(
  submissionCharacterParticipantLink
);

import User from "./models/user/rootResolver";
import ApiKey from "./models/apiKey/rootResolver";
import Era from "./models/era/rootResolver";
import EventClass from "./models/eventClass/rootResolver";
import EventGroup from "./models/eventGroup/rootResolver";
import Event from "./models/event/rootResolver";
import Submission from "./models/submission/rootResolver";
import Character from "./models/character/rootResolver";
import Github from "./models/github/rootResolver";
import File from "./models/file/rootResolver";

import SubmissionCharacterParticipantLink from "./links/submissionCharacterParticipantLink/rootResolver";

allServices.User.setRootResolvers(User);
allServices.ApiKey.setRootResolvers(ApiKey);
allServices.Era.setRootResolvers(Era);
allServices.EventClass.setRootResolvers(EventClass);
allServices.EventGroup.setRootResolvers(EventGroup);
allServices.Event.setRootResolvers(Event);
allServices.Submission.setRootResolvers(Submission);
allServices.Character.setRootResolvers(Character);
allServices.Github.setRootResolvers(Github);
allServices.File.setRootResolvers(File);

allServices.SubmissionCharacterParticipantLink.setRootResolvers(
  SubmissionCharacterParticipantLink
);
