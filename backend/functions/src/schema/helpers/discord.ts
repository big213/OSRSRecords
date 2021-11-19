import axios from "axios";

export function sendDiscordMessage(
  discordWebhookUrl: string,
  messagePayload: any
) {
  return axios.post(discordWebhookUrl, messagePayload);
}
