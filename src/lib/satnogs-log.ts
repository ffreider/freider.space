import saved from "./framsat-log.json";
import { LAUNCH } from "./stamp";

// Every good SatNOGS reception of FramSat-1 since launch, for the logbook
// (/framsat/log). SatNOGS rate-limits its API, so the settled history is
// saved in framsat-log.json (scripts/framsat-log.mjs makes it), and only the
// days after that are asked for, one day per request. A day stops changing
// once its recordings are processed and vetted, so days older than two are
// kept for a week; the last two are refreshed every 15 minutes.

const API = "https://network.satnogs.org/api/observations/";
const DAY = 86_400_000;
const SETTLED_MS = 2 * DAY;
const AT_ONCE = 2; // days fetched in parallel, to go easy on SatNOGS

export type LogEntry = {
  id: number;
  start: string; // ISO
  station: string;
  stationId: number;
  lat: number;
  lon: number;
  maxElevation: number; // degrees
  waterfall: string | null; // the full image on SatNOGS' storage
};

type Observation = {
  id: number;
  start: string;
  station_name: string | null;
  ground_station: number | null;
  station_lat: number | null;
  station_lng: number | null;
  max_altitude: number | null;
  waterfall: string | null;
};

export const observationUrl = (id: number) => `https://network.satnogs.org/observations/${id}/`;

// One UTC day, following SatNOGS' pages (25 observations each) to the end.
async function day(from: number): Promise<LogEntry[]> {
  const settled = Date.now() - (from + DAY) > SETTLED_MS;
  const query = new URLSearchParams({
    norad_cat_id: "98914",
    status: "good",
    format: "json",
    start: new Date(from).toISOString(),
    end: new Date(from + DAY).toISOString(),
  });
  let url: string | null = `${API}?${query}`;
  const out: LogEntry[] = [];
  for (let page = 0; url && page < 20; page++) {
    const res: Response = await fetch(url, {
      next: { revalidate: settled ? 7 * 86_400 : 900 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`SatNOGS ${res.status}`);
    const data: Observation[] = await res.json();
    for (const o of data) {
      if (typeof o?.id !== "number" || typeof o.start !== "string") continue;
      out.push({
        id: o.id,
        start: o.start,
        station: String(o.station_name ?? "Unknown station"),
        stationId: Number(o.ground_station),
        lat: Number(o.station_lat),
        lon: Number(o.station_lng),
        maxElevation: Number(o.max_altitude),
        waterfall: typeof o.waterfall === "string" ? o.waterfall : null,
      });
    }
    url = res.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
  }
  return out;
}

// Newest first. If SatNOGS can't be reached for some day, the log says so
// rather than quietly showing fewer receptions.
export async function receptionLog(): Promise<{ entries: LogEntry[]; complete: boolean; asOf: number }> {
  const asOf = Date.now();
  const from = Math.max(Date.parse(saved.until), Math.floor(LAUNCH / DAY) * DAY);
  const days: number[] = [];
  for (let t = from; t <= asOf; t += DAY) days.push(t);

  const results: (LogEntry[] | null)[] = new Array(days.length).fill(null);
  let next = 0;
  await Promise.all(
    Array.from({ length: AT_ONCE }, async () => {
      while (next < days.length) {
        const i = next++;
        results[i] = await day(days[i]).catch(() => null);
      }
    }),
  );
  // A pass that runs past midnight is in both days' answers; keep it once.
  const byId = new Map<number, LogEntry>();
  for (const e of [...(saved.entries as LogEntry[]), ...results.flatMap((r) => r ?? [])]) byId.set(e.id, e);
  const entries = [...byId.values()].sort((a, b) => b.start.localeCompare(a.start));
  return { entries, complete: results.every((r) => r !== null), asOf };
}

// The waterfall image for one reception, for the thumbnail route. Taken from
// the log itself, so thumbnails cost SatNOGS' API nothing, and only for
// FramSat-1, so the route can't be used to fetch anything else.
export async function waterfallUrl(id: number): Promise<string | null> {
  const { entries } = await receptionLog();
  return entries.find((e) => e.id === id)?.waterfall ?? null;
}
