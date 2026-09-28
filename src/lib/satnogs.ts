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
