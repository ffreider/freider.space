// Packs CelesTrak's satellite catalogue (SATCAT) for the space-age story
// (/space): every object ever catalogued in Earth orbit, with launch and
// decay dates, kind and orbit size and tilt, in a small binary the browser
// reads (layout in src/lib/space/catalogue.ts).
//
//   curl -o satcat.csv https://celestrak.org/pub/satcat.csv
//   node scripts/space-catalogue.mjs satcat.csv 2026-10-18
//
// The second argument is the snapshot date (the day the CSV was fetched);
// the page quotes it, and every count in the story comes from this file.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const [csvPath, snapshot] = process.argv.slice(2);
if (!csvPath || !/^\d{4}-\d\d-\d\d$/.test(snapshot ?? "")) {
  console.error("usage: node scripts/space-catalogue.mjs <satcat.csv> <YYYY-MM-DD>");
  process.exit(1);
}

const EPOCH = Date.UTC(1957, 9, 4);
const day = (iso) => Math.floor((Date.parse(`${iso}T00:00:00Z`) - EPOCH) / 86_400_000);
const KIND = { PAY: 0, "R/B": 1, DEB: 2, UNK: 3 };
const MAX_APOGEE = 400_000; // km; a few objects head out toward the Moon

const [header, ...lines] = readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
const col = Object.fromEntries(header.split(",").map((name, i) => [name, i]));
const end = day(snapshot);
const rows = [];
let skipped = 0;
for (const line of lines) {
  const f = line.split(",");
  if (f[col.ORBIT_CENTER] !== "EA" || !f[col.LAUNCH_DATE]) continue;
  const launch = day(f[col.LAUNCH_DATE]);
  const decay = f[col.DECAY_DATE] ? day(f[col.DECAY_DATE]) : null;
  let perigee = parseFloat(f[col.PERIGEE]);
  let apogee = parseFloat(f[col.APOGEE]);
  const incl = parseFloat(f[col.INCLINATION]);
  const period = parseFloat(f[col.PERIOD]);
  if (launch < 0 || launch > end || ![perigee, apogee, incl, period].every(Number.isFinite) || (decay !== null && decay < launch)) {
    skipped++;
    continue;
  }
  if (apogee < perigee) [apogee, perigee] = [perigee, apogee];
  apogee = Math.min(apogee, MAX_APOGEE);
  rows.push({ norad: +f[col.NORAD_CAT_ID], launch, decay, kind: KIND[f[col.OBJECT_TYPE]] ?? 3, perigee, apogee, incl, period });
}

const buf = Buffer.alloc(8 + 32 * rows.length);
buf.writeUInt32LE(0x53504331, 0);
buf.writeUInt32LE(rows.length, 4);
rows.forEach((r, i) => {
  const p = 8 + 32 * i;
  buf.writeUInt32LE(r.norad, p);
  buf.writeUInt16LE(r.launch, p + 4);
  buf.writeUInt16LE(r.decay ?? 0xffff, p + 6);
  buf.writeUInt8(r.kind, p + 8);
  buf.writeFloatLE(r.perigee, p + 12);
  buf.writeFloatLE(r.apogee, p + 16);
  buf.writeFloatLE(r.incl, p + 20);
  buf.writeFloatLE(r.period, p + 24);
});
mkdirSync("public/space", { recursive: true });
writeFileSync("public/space/catalogue.bin", buf);
writeFileSync("src/lib/space/snapshot.json", JSON.stringify({ date: snapshot, objects: rows.length }, null, 2) + "\n");
console.log(`${rows.length} objects packed (${skipped} skipped), ${(buf.length / 1e6).toFixed(2)} MB`);
