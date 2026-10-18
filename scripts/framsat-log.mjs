// Saves FramSat-1's settled SatNOGS receptions (everything up to two days ago)
// to src/lib/framsat-log.json, for the logbook (/framsat/log). The site then
// only asks SatNOGS for the days after it, which keeps it well inside
// SatNOGS' rate limit. Rerun now and then to keep the live part small:
//
//   node scripts/framsat-log.mjs
//
// It walks SatNOGS' pages one at a time, and when SatNOGS asks it to slow
// down (HTTP 429), it waits as long as told and carries on.

import { writeFile } from "node:fs/promises";

const DAY = 86_400_000;
const until = new Date(Math.floor(Date.now() / DAY) * DAY - 2 * DAY); // UTC midnight, two days ago
const query = new URLSearchParams({ norad_cat_id: "98914", status: "good", format: "json", end: until.toISOString() });
let url = `https://network.satnogs.org/api/observations/?${query}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const entries = [];
while (url) {
  const res = await fetch(url);
  if (res.status === 429) {
    const wait = Number(res.headers.get("retry-after") ?? 60);
    console.log(`SatNOGS asks to wait ${wait} s`);
    await sleep((wait + 5) * 1000);
    continue;
  }
  if (!res.ok) throw new Error(`SatNOGS ${res.status}`);
  for (const o of await res.json()) {
    entries.push({
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
  console.log(`${entries.length} receptions, back to ${entries.at(-1)?.start}`);
  url = res.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
  await sleep(1500);
}

const file = new URL("../src/lib/framsat-log.json", import.meta.url);
await writeFile(file, JSON.stringify({ until: until.toISOString(), entries }) + "\n");
console.log(`Saved ${entries.length} receptions before ${until.toISOString()}`);
