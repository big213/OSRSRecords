import axios from "axios";
import { env } from "../../config";

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
