import { env } from "../../config";

// tens digits only
export function serializeTime(ms: number | null): string | null {
  if (!ms) return null;
  let totalCs = Number(ms) / 10;

  const minutes = Math.floor(totalCs / (60 * 100));

  totalCs -= minutes * 60 * 100;

  const seconds = Math.floor(totalCs / 100);

  totalCs -= seconds * 100;

  const cs = totalCs;

  return (
    (minutes ? minutes + ":" : "0:") +
    String(seconds).padStart(2, "0") +
    "." +
    String(Math.floor(cs / 10)).padStart(1, "0")
  );
}

export function formatUnixTimestamp(unixTimestampSeconds: number) {
  const date = new Date(unixTimestampSeconds * 1000);

  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

export function generateLeaderboardRoute(leaderboardInputs: {
  eventId: string | null;
  eventEraId: string | null;
  eventEraMode: string | null;
  participants: number | null | "__undefined";
  isSoloPersonalBest: boolean | null;
}) {
  // if participants is null, translate to undefined
  const paramsStr: string = Object.entries(leaderboardInputs)
    .filter(([_key, value]) => value)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("&");

  return (
    `${env.site.base_url}/leaderboard` + (paramsStr ? "?" + paramsStr : "")
  );
}

// checks if a url is some sort of video content
export function isVideoUrl(url: string) {
  return url.match(
    /(\.(gif|mp4)$)|(youtu\.be|youtube\.com|streamable\.com|gfycat\.com)/
  );
}

// is the file a direct link to a url
export function isFileUrl(url: string) {
  return !!url
    .split("/")
    .pop()
    ?.match(/\.[a-zA-Z0-9]*/);
}

export function isCdnUrl(url: string) {
  return !!url.match(/^https:\/\/cdn.osrsrecords.com/);
}
