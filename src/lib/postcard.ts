import { unstable_cache } from "next/cache";
import { PERIOD_S, type Ridges, ridgesFromWaterfall } from "./waterfall";
import { LAUNCH } from "./stamp";

export { LAUNCH, parseStamp, stampOf } from "./stamp";

// A postcard is a moment, to the minute: freider.space/postcard/20261014T0732Z.
// It shows the clearest SatNOGS reception of FramSat-1 near that moment as
// ridge lines. Nothing is stored about anyone: the link itself is the
// postcard, and the same link always draws the same plate.

const WINDOW_MS = 12 * 3600_000; // look this far either side of the moment
const MIN_HEARD = 3; // fewer packets than this and it's just noise
const CANDIDATES = 4; // receptions processed per postcard, at most
// SatNOGS processes recordings some hours after each pass; until then a
// recent moment's postcard is still "developing".
const DEVELOPING_MS = 12 * 3600_000;

const OBSERVATIONS = "https://network.satnogs.org/api/observations/";

// The plate number: minutes since launch, so every minute has its own.
export const plateNumber = (moment: Date) => Math.floor((moment.getTime() - LAUNCH) / 60_000);

type Observation = {
  id: number;
  start: string;
  end: string;
  station_name: string | null;
  station_lat: number | null;
  station_lng: number | null;
  waterfall: string | null;
  demoddata?: unknown[];
};

export type Pass = {
  id: number;
  station: string;
  lat: number | null;
  lon: number | null;
  start: string; // ISO
  durationS: number;
  url: string;
  ridges: Ridges;
};

export type Postcard =
  | { kind: "ready"; moment: Date; pass: Pass; mine: number } // mine: slot index, or -1 if outside the pass
  | { kind: "developing"; moment: Date }
  | { kind: "none"; moment: Date };

// Good receptions with a waterfall that started within the window. Once a
// window is well in the past it won't change, so it's cached for a long time.
async function observations(from: number, to: number): Promise<Observation[]> {
  const settled = to < Date.now() - DEVELOPING_MS;
  const url =
    `${OBSERVATIONS}?norad_cat_id=98914&status=good&format=json` +
    `&start=${new Date(from).toISOString()}&end=${new Date(to).toISOString()}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: settled ? 30 * 86400 : 900 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? data.filter((o) => typeof o?.waterfall === "string" && o.start && o.end) : [];
  } catch {
    return [];
  }
}

// A reception's ridge lines, worked out once and kept: a waterfall never changes.
const ridgesOf = unstable_cache(
  async (waterfall: string, durationS: number): Promise<Ridges | null> => {
    try {
      const res = await fetch(waterfall, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
      if (!res.ok) return null;
      return await ridgesFromWaterfall(await res.arrayBuffer(), durationS);
    } catch {
      return null;
    }
  },
  ["ridges-v1"],
  { revalidate: false },
);

export async function postcardFor(moment: Date): Promise<Postcard> {
  const t = moment.getTime();
  // Whole hours, so every minute in an hour shares one cached lookup (and
  // trying lots of made-up minutes can't make lots of requests to SatNOGS).
  const HOUR = 3600_000;
  const found = await observations(Math.floor((t - WINDOW_MS) / HOUR) * HOUR, Math.ceil((t + WINDOW_MS) / HOUR) * HOUR);
  const inside = (o: Observation) => Date.parse(o.start) <= t && t <= Date.parse(o.end);
  const distance = (o: Observation) => (inside(o) ? 0 : Math.min(Math.abs(Date.parse(o.start) - t), Math.abs(Date.parse(o.end) - t)));
  // Closeness first, in steps: during the moment, within an hour, within
  // three, within twelve. Within a step, the clearest pass wins.
  const tier = (o: Observation) => (inside(o) ? 0 : distance(o) < 3600_000 ? 1 : distance(o) < 3 * 3600_000 ? 2 : 3);
  const ranked = found
    .sort((a, b) => tier(a) - tier(b) || (b.demoddata?.length ?? 0) - (a.demoddata?.length ?? 0) || distance(a) - distance(b))
    .slice(0, CANDIDATES);

  const processed = await Promise.all(
    ranked.map(async (o) => {
      const durationS = (Date.parse(o.end) - Date.parse(o.start)) / 1000;
      const ridges = await ridgesOf(o.waterfall!, durationS);
      return ridges && ridges.heard.filter(Boolean).length >= MIN_HEARD ? { o, durationS, ridges } : null;
    }),
  );
  const pick = processed
    .filter((p) => p !== null)
    .sort((a, b) => tier(a.o) - tier(b.o) || b.ridges.clarity - a.ridges.clarity)[0];

  if (!pick) {
    return Date.now() - t < DEVELOPING_MS ? { kind: "developing", moment } : { kind: "none", moment };
  }
  const { o, durationS, ridges } = pick;
  const into = (t - Date.parse(o.start)) / 1000;
  const mine = inside(o)
    ? Math.max(0, Math.min(ridges.lines.length - 1, Math.round((into - ridges.phase) / PERIOD_S)))
    : -1;
  return {
    kind: "ready",
    moment,
    mine,
    pass: {
      id: o.id,
      station: (o.station_name ?? "").trim() || "a ground station",
      lat: Number.isFinite(o.station_lat) ? o.station_lat : null,
      lon: Number.isFinite(o.station_lng) ? o.station_lng : null,
      start: o.start,
      durationS,
      url: `https://network.satnogs.org/observations/${o.id}/`,
      ridges,
    },
  };
}
