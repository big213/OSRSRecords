import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { BaseService } from "../../core/services";
import axios from "axios";
import { permissionsCheck } from "../../core/helpers/permissions";
import { env } from "../../../config";
import { EventEra, Submission } from "../../services";
import { updateTableRow } from "../../core/helpers/sql";
import { sendDiscordRequest } from "../../helpers/discord";

const prodResource = axios.create({
  baseURL: "https://api.imgur.com/3",
});

export class ImgurService extends BaseService {
  accessControl: AccessControlMap = {};

  @permissionsCheck("get")
  async sendDiscordRequest({
    req,
    fieldPath,
    args,
    query,
    isAdmin = false,
  }: ServiceFunctionInputs) {
    const validatedArgs = <any>args;

    if (
      !["get", "post", "put", "delete", "patch"].includes(validatedArgs.method)
    )
      throw new Error(`Invalid method: ${validatedArgs.method}`);

    return sendDiscordRequest(
      validatedArgs.method,
      validatedArgs.path,
      validatedArgs.params
    );
  }

  @permissionsCheck("get")
  async getImageData({
    req,
    fieldPath,
    args,
    query,
    isAdmin = false,
  }: ServiceFunctionInputs) {
    const validatedArgs = <any>args;
    const { data } = await prodResource.get("/image/" + validatedArgs, {
      headers: {
        Authorization: "Client-ID " + env.imgur.client_id,
      },
    });

    return data.data;
  }

  async syncIsSoloPersonalBest() {
    const submissions = await Submission.lookupMultipleRecord(
      ["id", "event.id", "participantsList"],
      {
        fields: [
          {
            field: "participants",
            value: 1,
          },
        ],
      },
      []
    );

    // map of eventId+characterId -> submissionId
    const submissionIdMap: Map<
      string,
      {
        submissionId: string;
        eventId: string;
      }
    > = new Map();

    submissions.forEach((submission) => {
      submissionIdMap.set(
        `${submission["event.id"]}-${submission.participantsList[0].characterId}`,
        {
          submissionId: submission.id,
          eventId: submission["event.id"],
        }
      );
    });

    // for each submissionId in the map, run syncSoloPBState
    for (const [key, submission] of submissionIdMap) {
      await Submission.syncSoloPBState(
        submission.submissionId,
        submission.eventId
      );
    }
  }

  async syncEvidenceKey() {
    // go through all submissions and sync evidenceKey field based on externalLinks
    const submissions = await Submission.lookupMultipleRecord(
      ["id", "externalLinks"],
      {
        fields: [],
      },
      []
    );

    for (const submission of submissions) {
      const evidenceKey = submission.externalLinks[0] ?? null;

      if (evidenceKey) {
        await updateTableRow({
          fields: {
            evidenceKey,
          },
          table: Submission.typename,
          where: {
            fields: [
              {
                field: "id",
                value: submission.id,
              },
            ],
          },
        });
      }
    }
  }

  async syncEventEra() {
    // go through all submissions and confirm if happenedOn corresponds to the eventEra beginDate and endDate. if not, correct it
    const submissions = await Submission.lookupMultipleRecord(
      [
        "id",
        "event.id",
        "eventEra.beginDate",
        "eventEra.endDate",
        "happenedOn",
      ],
      {
        fields: [],
      },
      []
    );

    const submissionsToCorrect: any[] = [];

    for (const submission of submissions) {
      if (submission.happenedOn < submission["eventEra.beginDate"]) {
        submissionsToCorrect.push(submission);
      }

      if (
        submission["eventEra.endDate"] &&
        submission.happenedOn > submission["eventEra.endDate"]
      ) {
        submissionsToCorrect.push(submission);
      }
    }

    for (const submission of submissionsToCorrect) {
      const eventEras = await EventEra.lookupMultipleRecord(
        ["id", "beginDate", "endDate"],
        {
          fields: [
            {
              field: "event",
              value: submission["event.id"],
            },
          ],
        },
        []
      );

      const matchingEventEra = eventEras.find((eventEra) => {
        return (
          submission.happenedOn >= eventEra.beginDate &&
          (eventEra.endDate === null ||
            submission.happenedOn <= eventEra.endDate)
        );
      });

      if (!matchingEventEra) {
        throw new Error("no matching event era for " + submission.id);
      }

      await updateTableRow({
        fields: {
          eventEra: matchingEventEra.id,
        },
        table: Submission.typename,
        where: {
          fields: [
            {
              field: "id",
              value: submission.id,
            },
          ],
        },
      });
    }
  }

  async syncHappenedOn() {
    // go through all submissions, sync the happenedOn with the imgur metadata
    const submissions = await Submission.lookupMultipleRecord(
      ["id", "externalLinks"],
      {
        fields: [
          {
            field: "createdAt",
            operator: "lt",
            value: 1641357843,
          },
        ],
      },
      []
    );

    for (const submission of submissions) {
      const firstExternalLink = submission.externalLinks[0];

      if (firstExternalLink) {
        const regexMatch = firstExternalLink.match(
          /https:\/\/i.imgur.com\/(.*?)\..*/
        );

        if (regexMatch) {
          const { data } = await prodResource.get("/image/" + regexMatch[1], {
            headers: {
              Authorization: "Client-ID " + env.imgur.client_id,
            },
          });

          await updateTableRow({
            fields: {
              happenedOn: data.data.datetime,
            },
            table: Submission.typename,
            where: {
              fields: [
                {
                  field: "id",
                  value: submission.id,
                },
              ],
            },
          });
        }
      }
    }
  }
}
