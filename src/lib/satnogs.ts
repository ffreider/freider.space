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
  seek: number; // seconds into the recording to start listening, near the top of the pass
  packets: string[]; // the start of a few packets from this pass, e.g. "FS1.0 fe 01 00 00 7e 00 40 61"
  url: string; // the observation on SatNOGS
};

// SatNOGS logs each decoded packet a few seconds after it can be heard: 3 to
// 4 s at one station, 9 to 10 at another. So the page finds the bursts in the
// audio itself, and the logs only say roughly where the good part of the pass is.
const MAX_LOG_DELAY_S = 11;
const PACKETS_SHOWN = 6;

// "data_15187287_2026-10-13T19-10-28" -> seconds after `start`
function packetOffset(name: string, start: string) {
  const stamp = name.match(/(\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d)/)?.[1];
  if (!stamp) return null;
  const [day, time] = stamp.split("T");
  const at = Date.parse(`${day}T${time.replace(/-/g, ":")}Z`);
  return (at - Date.parse(start)) / 1000;
}

// A packet's first bytes, from FramSat-1's "FS1.0" marker on. The byte after
// it counts up by one with each packet.
async function packetStart(url: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const marker = new TextEncoder().encode("FS1.0");
    const i = bytes.findIndex((_, j) => marker.every((m, k) => bytes[j + k] === m));
    const from = i >= 0 ? i + marker.length : 0;
    const hex = [...bytes.slice(from, from + 8)].map((b) => b.toString(16).padStart(2, "0")).join(" ");
    return i >= 0 ? `FS1.0 ${hex}` : hex;
  } catch {
    return null;
  }
}

// The newest good recording with enough decoded packets to fill the
// highlight reel, starting a little before the middle one.
export async function latestRecording(): Promise<Recording | null> {
  try {
    const res = await fetch(OBSERVATIONS_URL, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return null;
    for (const o of data) {
      if (typeof o?.payload !== "string" || !o.payload.endsWith(".ogg") || typeof o.start !== "string") continue;
      const logged = (Array.isArray(o.demoddata) ? o.demoddata : [])
        .map((d: { payload_demod?: unknown }) => ({
          url: String(d?.payload_demod ?? ""),
          at: packetOffset(String(d?.payload_demod ?? ""), o.start),
        }))
        .filter((p: { at: number | null }): p is { url: string; at: number } => p.at !== null && p.at > MAX_LOG_DELAY_S)
        .sort((a: { at: number }, b: { at: number }) => a.at - b.at);
      if (logged.length < PACKETS_SHOWN) continue;
      const first = Math.max(0, Math.floor((logged.length - PACKETS_SHOWN) / 2));
      const shown = logged.slice(first, first + PACKETS_SHOWN);
      const packets = (await Promise.all(shown.map((p: { url: string }) => packetStart(p.url)))).filter(
        (p): p is string => p !== null,
      );
      return {
        audio: o.payload,
        start: o.start,
        station: String(o.station_name ?? "a ground station"),
        lat: Number(o.station_lat),
        lon: Number(o.station_lng),
        seek: shown[0].at - MAX_LOG_DELAY_S,
        packets,
        url: `https://network.satnogs.org/observations/${o.id}/`,
      };
    }
    return null;
  } catch {
    return null;
  }
}
