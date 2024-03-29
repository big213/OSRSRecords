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
  subAlerts: env.discord.sub_alerts_channel_id,
  updateLogs: env.discord.update_logs_channel_id,
  guildId: env.discord.guild_id,
};

// must be the complete user id, e.g. "10000000000000"
export const discordUserIdMap = {
  reviewer: env.discord.reviewer_user_id,
};

export async function sendDiscordRequest(
  method: "get" | "post" | "put" | "delete" | "patch",
  path: string,
  params: any
) {
  const { data } = await discordApi.request({
    method,
    url: path,
    headers: authHeaders.headers,
    params: method === "get" ? params : null,
    data: method !== "get" ? params : null,
  });

  return data;
}

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

export async function crosspostDiscordMessage(
  channelId: string,
  messageId: string
) {
  const { data } = await discordApi.post(
    `/channels/${channelId}/messages/${messageId}/crosspost`,
    null,
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

export async function getGuildMemberId(guildId: string, username: string) {
  const { data } = await discordApi.get(
    `/guilds/${guildId}/members/search?query=${username}`,
    authHeaders
  );

  return data.find((guildMember) => {
    if (!guildMember.user) return false;
    return guildMember.user.username.toLowerCase() === username.toLowerCase();
  })?.user.id;
}

export async function createDMChannel(discordUserId: string) {
  const { data } = await discordApi.post(
    `/users/@me/channels`,
    {
      recipient_id: discordUserId,
    },
    authHeaders
  );

  return data.id;
}

export const decimalColors = {
  ORANGE: 16752660,
  YELLOW: 16772426,
  GREEN: 5944670,
  PURPLE: 10762422,
  RED: 16077382,
  GOLD: 16766720,
  SILVER: 12632256,
  BRONZE: 13808780,
};

export const placeEmojisMap = {
  "1": "🥇",
  "2": "🥈",
  "3": "🥉",
};

export const submissionStatusArray = [
  {
    text: "Submitted",
    value: "SUBMITTED",
    emoji: "🟧",
    colorId: decimalColors.ORANGE,
  },
  {
    text: "Under Review",
    value: "UNDER_REVIEW",
    emoji: "🟨",
    colorId: decimalColors.YELLOW,
  },
  {
    text: "Approved",
    value: "APPROVED",
    emoji: "🟩",
    colorId: decimalColors.GREEN,
  },
  {
    text: "Information Requested",
    value: "INFORMATION_REQUESTED",
    emoji: "🟪",
    colorId: decimalColors.PURPLE,
  },
  {
    text: "Rejected",
    value: "REJECTED",
    emoji: "🟥",
    colorId: decimalColors.RED,
  },
];

export const submissionStatusMap = submissionStatusArray.reduce(
  (total, entry) => {
    total[entry.value] = entry;
    return total;
  },
  {}
);

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

export function generateViewSubmissionButtonComponent(
  submissionId: string,
  isPublic = false
) {
  return {
    type: 1,
    components: [
      {
        type: 2,
        label: "View Submission",
        style: 5,
        url: `${env.site.base_url}/${
          isPublic ? "s/view/user-submission" : "a/view/submission"
        }?id=${submissionId}&expand=0`,
      },
    ],
  };
}

const participantsTextMap = {
  "0": "Unknown",
  "1": "Solo",
  "2": "Duo",
  "3": "Trio",
};

export function generateParticipantsText(participants: number | null) {
  if (participants === null) return "Fastest Completion";

  return participantsTextMap[participants] ?? participants + "-Man";
}

export function generateEventText(
  eventName: string,
  participants: number | null,
  maxParticipants: number | null
) {
  return `${eventName}${
    maxParticipants === 1 ? "" : " - " + generateParticipantsText(participants)
  }`;
}
