// Packs CelesTrak's satellite catalogue (SATCAT) for the space-age story
// (/space): every object catalogued in Earth orbit that the story can show,
// with the day it appears and the day it fell back, its kind, and its orbit's
// size and tilt, in a small binary the browser reads (layout in
// src/lib/space/catalogue.ts).
//
//   curl -o satcat.csv https://celestrak.org/pub/satcat.csv
//   curl -o gcat.tsv https://planet4589.org/space/gcat/tsv/cat/satcat.tsv
//   node scripts/space-catalogue.mjs satcat.csv 2026-10-18 gcat.tsv 2019-05-24
//
// The second argument is the snapshot date (the day the CSV was fetched);
// the page quotes it. The third is Jonathan McDowell's GCAT, for the early
// orbits of objects that have since fallen (src/lib/space/early.ts). The
// last is the latest day the story reaches: objects that appear after it
// aren't shipped. Every count in the story comes from this file.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { appearDay, cataloguedBy } from "../src/lib/space/appear.ts";
import { encodeCatalogue } from "../src/lib/space/catalogue.ts";
import { storyOrbit } from "../src/lib/space/early.ts";

const ISO = /^\d{4}-\d\d-\d\d$/;
const [csvPath, snapshot, gcatPath, until] = process.argv.slice(2);
if (!csvPath || !ISO.test(snapshot ?? "") || !gcatPath || !ISO.test(until ?? "")) {
  console.error("usage: node scripts/space-catalogue.mjs <satcat.csv> <snapshot YYYY-MM-DD> <gcat satcat.tsv> <until YYYY-MM-DD>");
  process.exit(1);
}

const EPOCH = Date.UTC(1957, 9, 4);
const day = (iso) => Math.floor((Date.parse(`${iso}T00:00:00Z`) - EPOCH) / 86_400_000);
const KIND = { PAY: 0, "R/B": 1, DEB: 2, UNK: 3 };
const KIND_OF = (type) => KIND[type] ?? 3;
const MAX_APOGEE = 400_000; // km; a few objects head out toward the Moon
const last = Math.min(day(snapshot), day(until));

// GCAT's early orbits, by catalogue number. Dates read like "1958 Feb  1".
const early = new Map();
const gcatLines = readFileSync(gcatPath, "utf8").split(/\r?\n/);
const g = Object.fromEntries(gcatLines[0].replace(/^#/, "").split("\t").map((name, i) => [name.trim(), i]));
for (const line of gcatLines) {
  if (!line || line.startsWith("#")) continue;
  const f = line.split("\t");
  const norad = parseInt(f[g.Satcat], 10);
  const when = Date.parse(`${f[g.ODate]?.trim().replace(/\s+/g, " ")} UTC`);
  if (!Number.isFinite(norad) || !Number.isFinite(when)) continue;
  early.set(norad, { perigee: parseFloat(f[g.Perigee]), apogee: parseFloat(f[g.Apogee]), incl: parseFloat(f[g.Inc]), oDay: Math.floor((when - EPOCH) / 86_400_000) });
}

const [header, ...lines] = readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
const col = Object.fromEntries(header.split(",").map((name, i) => [name, i]));

// When each catalogue number was given out, estimated from every launched
// object, also those this page doesn't draw (see src/lib/space/appear.ts).
const all = lines
  .map((line) => line.split(","))
  .filter((f) => f[col.LAUNCH_DATE])
  .map((f) => ({ norad: +f[col.NORAD_CAT_ID], intl: f[col.OBJECT_ID], name: f[col.OBJECT_NAME], kind: KIND_OF(f[col.OBJECT_TYPE]), launchDay: day(f[col.LAUNCH_DATE]) }));
const catalogued = cataloguedBy(all);

const objs = [];
let skipped = 0;
let earlyOrbits = 0;
for (const line of lines) {
  const f = line.split(",");
  if (f[col.ORBIT_CENTER] !== "EA" || !f[col.LAUNCH_DATE]) continue;
  const launch = day(f[col.LAUNCH_DATE]);
  const decay = f[col.DECAY_DATE] ? day(f[col.DECAY_DATE]) : null;
  const numbers = [f[col.PERIGEE], f[col.APOGEE], f[col.INCLINATION], f[col.PERIOD]].map(parseFloat);
  if (launch < 0 || !numbers.every(Number.isFinite) || (decay !== null && decay < launch)) {
    skipped++;
    continue;
  }
  const kind = KIND_OF(f[col.OBJECT_TYPE]);
  const norad = +f[col.NORAD_CAT_ID];
  const appear = appearDay({ norad, intl: f[col.OBJECT_ID], name: f[col.OBJECT_NAME], kind, launchDay: launch }, catalogued);
  // After the story ends, or never visible (fell on or before the day it appears).
  if (appear > last || (decay !== null && decay <= appear)) {
    skipped++;
    continue;
  }
  const [perigee0, apogee0, incl0, period0] = numbers;
  const orbit = storyOrbit({ perigee: perigee0, apogee: apogee0, incl: incl0, period: period0, launchDay: launch, decayDay: decay }, early.get(norad));
  if (orbit.perigee !== perigee0) earlyOrbits++;
  let { perigee, apogee } = orbit;
  if (apogee < perigee) [apogee, perigee] = [perigee, apogee];
  objs.push({ norad, launchDay: appear, decayDay: decay, kind, perigeeKm: perigee, apogeeKm: Math.min(apogee, MAX_APOGEE), inclinationDeg: orbit.incl, periodMin: orbit.period });
}

const buf = Buffer.from(encodeCatalogue(objs));
mkdirSync("public/space", { recursive: true });
writeFileSync("public/space/catalogue.bin", buf);
writeFileSync("src/lib/space/snapshot.json", JSON.stringify({ date: snapshot, until, objects: objs.length }, null, 2) + "\n");
console.log(`${objs.length} objects packed (${skipped} skipped, ${earlyOrbits} in their early orbit), ${(buf.length / 1e6).toFixed(2)} MB`);
