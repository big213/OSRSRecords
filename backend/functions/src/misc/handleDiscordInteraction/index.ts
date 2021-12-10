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
      const status = message.data.values[0];

      if (!status) throw new Error("Status required");

      switch (command) {
        case "updateSubmissionStatus":
          // acknowledge immediately
          res.send({
            type: InteractionResponseType.UPDATE_MESSAGE,
            data: {
              content: "Processing...",
            },
          });
          // call API with api-key to reject or approve
          await executeGiraffeql({
            updateSubmission: {
              __args: {
                item: {
                  id: submissionId,
                },
                fields: {
                  status,
                },
              },
            },
          });
          break;
        default:
          throw new Error("Invalid button command");
      }
    } else if (message.type === InteractionType.PING) {
      res.send({
        type: InteractionResponseType.PONG,
        data: {
          content: "PONG",
        },
      });
    } else {
      throw new Error("Unhandled request type");
    }
  } catch (err: any) {
    console.log(err);
    res.send({
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        content: `An error has occurred: ${err.message}`,
      },
    });
  }
});

export const handleDiscordInteraction = functions.https.onRequest(app);
