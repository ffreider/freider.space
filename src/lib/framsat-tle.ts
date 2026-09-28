// FramSat-1's orbital elements (TLE), from the SatNOGS database. Refreshed at
// most every 6 hours; if SatNOGS can't be reached, the last known TLE is used.

const SATNOGS_URL = "https://db.satnogs.org/api/tle/?norad_cat_id=98914&format=json";

export type Tle = { line1: string; line2: string };

// From SatNOGS, updated 2026-09-25.
const FALLBACK: Tle = {
  line1: "1 98914U 26203B   26267.74444959  .00002983  00000-0  22116-3 0  9990",
  line2: "2 98914  97.4205 342.2551 0057654 211.8046 147.9693 15.02507306  2843",
};

export async function framsatTle(): Promise<Tle> {
  try {
    const res = await fetch(SATNOGS_URL, { next: { revalidate: 21600 } });
    if (!res.ok) return FALLBACK;
    const [latest] = await res.json();
    if (typeof latest?.tle1 !== "string" || typeof latest?.tle2 !== "string") {
      return FALLBACK;
    }
    return { line1: latest.tle1, line2: latest.tle2 };
  } catch {
    return FALLBACK;
  }
}
