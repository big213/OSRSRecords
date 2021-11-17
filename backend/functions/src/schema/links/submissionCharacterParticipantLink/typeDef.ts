import { GiraffeqlObjectType } from "giraffeql";
import { generateLinkTypeDef } from "../../core/generators";
import { generateStringField } from "../../core/helpers/typeDef";
import {
  SubmissionCharacterParticipantLink,
  Submission,
  Character,
} from "../../services";

export default new GiraffeqlObjectType(
  generateLinkTypeDef(
    {
      submission: {
        service: Submission,
      },
      character: {
        service: Character,
      },
    },
    SubmissionCharacterParticipantLink,
    {
      title: generateStringField({
        allowNull: true,
      }),
    }
  )
);
