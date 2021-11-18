import axios from "axios";

export function sendDiscordMessage(discordWebhookUrl: string, message: string) {
  return axios.post(discordWebhookUrl, {
    content: message,
  });
}
