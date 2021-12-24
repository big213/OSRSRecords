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
    (minutes ? minutes + ":" : "") +
    (minutes ? String(seconds).padStart(2, "0") : seconds) +
    "." +
    String(Math.floor(cs / 10)).padStart(1, "0")
  );
}

export function formatUnixTimestamp(unixTimestampSeconds: number) {
  const date = new Date(unixTimestampSeconds * 1000);

  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

export function generateCrudRecordInterfaceUrl(
  route: string,
  pageOptions?: any
) {
  return (
    env.site.base_url +
    (route +
      (pageOptions
        ? "?pageOptions=" +
          encodeURIComponent(btoa(JSON.stringify(pageOptions)))
        : ""))
  );
}

export function generateLeaderboardPageOptions({
  eventId,
  eventEraId,
  participants,
}: {
  eventId: string;
  eventEraId: string;
  participants?: number;
}) {
  return {
    sortBy: ["score"],
    sortDesc: [false],
    filters: [
      {
        field: "event",
        operator: "eq",
        value: eventId, // COX CM on prod db
      },
      {
        field: "eventEra",
        operator: "eq",
        value: eventEraId,
      },
      ...(participants
        ? [
            {
              field: "participants",
              operator: "eq",
              value: participants,
            },
          ]
        : []),
    ],
  };
}
