// Today's Sun, as NOAA's GOES-19 weather satellite sees it with its SUVI
// telescope at 304 Å (extreme ultraviolet): the chromosphere and the
// prominences above it. A new image comes every few minutes; the newest one
// is looked up at most every 15 minutes.

const SUVI = "https://services.swpc.noaa.gov/images/animations/suvi/primary/304/";

export type SunImage = { url: string; time: string };

// The newest image in NOAA's folder, and when it was taken (from its name,
// e.g. or_suvi-l2-ci304_g19_s20261011T111200Z_...png).
export async function latestSun(): Promise<SunImage | null> {
  try {
    const res = await fetch(SUVI, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    const files = [...(await res.text()).matchAll(/href="(or_suvi-l2-ci304[^"]+\.png)"/g)].map((m) => m[1]);
    const name = files.sort().at(-1);
    const t = name?.match(/_s(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/);
    if (!name || !t) return null;
    return { url: SUVI + name, time: `${t[1]}-${t[2]}-${t[3]}T${t[4]}:${t[5]}:${t[6]}Z` };
  } catch {
    return null;
  }
}

// How SUVI frames the Sun: centred, with the disk's radius 0.3 of the width.
export const SUVI_DISK_RADIUS = 0.3;
