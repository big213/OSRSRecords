import * as functions from "firebase-functions";
import {
  InteractionResponseType,
  InteractionType,
  verifyKeyMiddleware,
} from "discord-interactions";
import * as express from "express";
import { executeGiraffeql } from "./services/api";
import { env } from "../../config";

const app = express();

app.use(express.raw());

app.post("*", verifyKeyMiddleware(env.discord.public_key), async (req, res) => {
  try {
    const message = req.body;
    if (message.type === InteractionType.APPLICATION_COMMAND) {
      res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Hello world",
        },
      });
    } else if (message.type === InteractionType.MESSAGE_COMPONENT) {
      const customIdParts = message.data.custom_id.split("_");
      const command = customIdParts[0];
      const submissionId = customIdParts[1];

      switch (command) {
        case "approve":
        case "reject":
          // call API with api-key to reject or approve
          await executeGiraffeql({
            updateSubmission: {
              __args: {
                item: {
                  id: submissionId,
                },
                fields: {
                  status: command === "approve" ? "APPROVED" : "REJECTED",
                },
              },
            },
          });
          // update the message
          res.send({
            type: InteractionResponseType.UPDATE_MESSAGE,
            data: {
              embeds: [
                {
                  title: `New submission ${
                    command === "approve" ? "Approved" : "Rejected"
                  }`,
                  url: "https://osrsrecords.com/submissions?pageOptions=eyJzb3J0QnkiOlsiY3JlYXRlZEF0Il0sInNvcnREZXNjIjpbdHJ1ZV0sImZpbHRlcnMiOlt7ImZpZWxkIjoic3RhdHVzIiwib3BlcmF0b3IiOiJpbiIsInZhbHVlIjpbIlVOREVSX1JFVklFVyIsIlNVQk1JVFRFRCJdfV19",
                  color: command === "approve" ? 65280 : 16711680,
                },
              ],
              components: [
                {
                  type: 1,
                  components: [
                    {
                      type: 2,
                      label: "View Submission",
                      style: 5,
                      url: `https://osrsrecords.com/a/view?id=${submissionId}&expand=0&type=submission`,
                    },
                  ],
                },
              ],
            },
          });
          break;
        default:
          throw new Error("Invalid button command");
      }
    } else {
      res.send({
        type: InteractionResponseType.PONG,
        data: {
          content: "PONG",
        },
      });
    }
  } catch (err: any) {
    res.send({
      type: InteractionResponseType.PONG,
      data: {
        content: "PONG - But an error has occurred: " + err.message,
      },
    });
  }
});

export const handleDiscordInteraction = functions.https.onRequest(app);
