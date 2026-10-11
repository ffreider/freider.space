// Orbital elements (TLEs) for everything the descent passes: Space Norway's
// ASBM and Thor satellites, the geostationary belt, Galileo and the ISS.
// Fetched from CelesTrak at most every 6 hours, a few groups at a time.
// Anything that can't be fetched keeps the elements saved in
// descent-tles.json (from 2026-10-10). FramSat-1 is added from SatNOGS.

import saved from "./descent-tles.json";
import { framsatTle } from "./framsat-tle";

export type Tles = Record<string, [line1: string, line2: string]>;

const CELESTRAK = "https://celestrak.org/NORAD/elements/gp.php";
const SOURCES = ["GROUP=stations", "GROUP=geo", "GROUP=galileo", "CATNR=60422", "CATNR=60423"];

const catalogNumber = (line1: string) => line1.slice(2, 7).trim();

// TLE text (name line, then the two element lines) as catalog number -> lines.
function parse(text: string) {
  const found = new Map<string, [string, string]>();
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd());
  for (let i = 0; i + 1 < lines.length; i++) {
    if (lines[i].startsWith("1 ") && lines[i + 1].startsWith("2 ")) {
      found.set(catalogNumber(lines[i]), [lines[i], lines[i + 1]]);
      i++;
    }
  }
  return found;
}

async function fetchGroup(query: string) {
  try {
    // a slow CelesTrak must not hold up the build (Vercel stops a page after 60 s)
    const res = await fetch(`${CELESTRAK}?${query}&FORMAT=tle`, { next: { revalidate: 21600 }, signal: AbortSignal.timeout(10000) });
    return res.ok ? parse(await res.text()) : new Map();
  } catch {
    return new Map();
  }
}

export async function descentTles(): Promise<Tles> {
  const [groups, framsat] = await Promise.all([Promise.all(SOURCES.map(fetchGroup)), framsatTle()]);
  const latest = new Map(groups.flatMap((g) => [...g]));

  const tles: Tles = {};
  for (const [name, lines] of Object.entries(saved as unknown as Tles)) {
    tles[name] = latest.get(catalogNumber(lines[0])) ?? lines;
  }
  tles["FRAMSAT-1"] = [framsat.line1, framsat.line2];
  return tles;
}
