// Recent receptions of FramSat-1 by SatNOGS, a worldwide network of amateur
// radio ground stations. Fetched on the server at most every 15 minutes, so
// visitors' browsers don't contact SatNOGS just by loading the page.

const OBSERVATIONS_URL =
  "https://network.satnogs.org/api/observations/?norad_cat_id=98914&status=good&format=json";

export type Reception = {
  id: number;
  start: string; // ISO time the observation started
  station: string;
  lat: number;
  lon: number;
  maxElevation: number; // degrees, highest point of the pass for that station
  waterfall: string | null; // PNG of the received spectrum over time
  url: string; // the observation on SatNOGS
};

export async function recentReceptions(limit = 8): Promise<Reception[]> {
  try {
    const res = await fetch(OBSERVATIONS_URL, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((o) => o && typeof o.id === "number" && typeof o.start === "string")
      .slice(0, limit)
      .map((o) => ({
        id: o.id,
        start: o.start,
        station: String(o.station_name ?? "Unknown station"),
        lat: Number(o.station_lat),
        lon: Number(o.station_lng),
        maxElevation: Number(o.max_altitude),
        waterfall: typeof o.waterfall === "string" ? o.waterfall : null,
        url: `https://network.satnogs.org/observations/${o.id}/`,
      }));
  } catch {
    return [];
  }
}

export type Recording = {
  audio: string; // Ogg Vorbis, about 12 minutes, mostly static
  start: string; // ISO time the recording started
  station: string;
  lat: number;
  lon: number;
  seek: number; // seconds into the recording, just before a packet burst
  url: string; // the observation on SatNOGS
};

// SatNOGS logs each decoded packet with the time it was decoded, which comes
// about 3.6 s after the burst itself can be heard.
const BURST_LEAD_S = 3.6;

// "data_15187287_2026-10-13T19-10-28" -> seconds after `start`
function packetOffset(name: string, start: string) {
  const stamp = name.match(/(\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d)/)?.[1];
  if (!stamp) return null;
  const [day, time] = stamp.split("T");
  const at = Date.parse(`${day}T${time.replace(/-/g, ":")}Z`);
  return (at - Date.parse(start)) / 1000;
}

// The newest good recording with at least two decoded packets, so there's
// a second burst to hear if the first one is missed.
export async function latestRecording(): Promise<Recording | null> {
  try {
    const res = await fetch(OBSERVATIONS_URL, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return null;
    for (const o of data) {
      if (typeof o?.payload !== "string" || !o.payload.endsWith(".ogg") || typeof o.start !== "string") continue;
      const packets = (Array.isArray(o.demoddata) ? o.demoddata : [])
        .map((d: { payload_demod?: unknown }) => packetOffset(String(d?.payload_demod ?? ""), o.start))
        .filter((s: number | null): s is number => s !== null && s > BURST_LEAD_S + 2)
        .sort((a: number, b: number) => a - b);
      if (packets.length < 2) continue;
      return {
        audio: o.payload,
        start: o.start,
        station: String(o.station_name ?? "a ground station"),
        lat: Number(o.station_lat),
        lon: Number(o.station_lng),
        seek: Math.max(0, packets[0] - BURST_LEAD_S - 1.5),
        url: `https://network.satnogs.org/observations/${o.id}/`,
      };
    }
    return null;
  } catch {
    return null;
  }
}
