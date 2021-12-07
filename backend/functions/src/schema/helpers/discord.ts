import axios from "axios";
import { env } from "../../config";
import { submissionStatusKenum } from "../enums";

const discordApi = axios.create({
  baseURL: "https://discord.com/api/v9",
});

const authHeaders = {
  headers: {
    Authorization: "Bot " + env.discord.token,
  },
};

export const channelMap = {
  subAlerts: "910711209450430514",
  updateLogs: "914575134692606023",
};

export async function sendDiscordMessage(
  channelId: string,
  messagePayload: any
) {
  const { data } = await discordApi.post(
    `/channels/${channelId}/messages`,
    messagePayload,
    authHeaders
  );

  return data;
}

export async function updateDiscordMessage(
  channelId: string,
  messageId: string,
  messagePayload: any
) {
  const { data } = await discordApi.patch(
    `/channels/${channelId}/messages/${messageId}`,
    messagePayload,
    authHeaders
  );

  return data;
}

export const submissionStatusArray = [
  {
    text: "Submitted",
    value: "SUBMITTED",
    emoji: "🟧",
    colorId: 16752660,
  },
  {
    text: "Under Review",
    value: "UNDER_REVIEW",
    emoji: "🟨",
    colorId: 16772426,
  },
  {
    text: "Approved",
    value: "APPROVED",
    emoji: "🟩",
    colorId: 5944670,
  },
  {
    text: "Information Requested",
    value: "INFORMATION_REQUESTED",
    emoji: "🟪",
    colorId: 10762422,
  },
  {
    text: "Rejected",
    value: "REJECTED",
    emoji: "🟥",
    colorId: 16077382,
  },
];

export function generateSubmissionStatusDropdownComponent(
  submissionId: string,
  selectedOption?: submissionStatusKenum
) {
  return {
    type: 1,
    components: [
      {
        type: 3,
        custom_id: "updateSubmissionStatus_" + submissionId,
        options: submissionStatusArray.map((submissionStatusObject) => ({
          label: submissionStatusObject.text,
          value: submissionStatusObject.value,
          emoji: {
            name: submissionStatusObject.emoji,
          },
          default: selectedOption
            ? selectedOption.name === submissionStatusObject.value
              ? true
              : false
            : false,
        })),
      },
    ],
  };
}

export function generateViewSubmissionButtonComponent(submissionId: string) {
  return {
    type: 1,
    components: [
      {
        type: 2,
        label: "View Submission",
        style: 5,
        url: `${env.site.base_url}/a/view?id=${submissionId}&expand=0&type=submission`,
      },
    ],
  };
}

export function generateSubmissionMessage(
  submissionId: string,
  selectedOption?: submissionStatusKenum
) {
  return {
    embeds: [
      {
        title: `Submission ID ${submissionId}`,
        color: 15105570,
      },
    ],
    components: [
      generateViewSubmissionButtonComponent(submissionId),
      generateSubmissionStatusDropdownComponent(submissionId, selectedOption),
    ],
  };
}
