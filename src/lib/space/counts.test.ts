import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { decodeCatalogue, dayOf } from "./catalogue.ts";
import { countAt, seriesAt } from "./counts.ts";

// The real snapshot; the expected numbers were counted independently
// (pandas, same filtering and debris-dating rules as scripts/space-catalogue.mjs
// and appear.ts, written separately).
const file = readFileSync(new URL("../../../public/space/catalogue.bin", import.meta.url));
const objs = decodeCatalogue(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));

test("at the end of 1957 two objects were up: Sputnik 1 and 2", () => {
  assert.deepEqual(countAt(objs, dayOf(new Date("1957-12-31T00:00Z"))), { satellites: 2, rocketBodies: 0, debris: 0, unknown: 0, total: 2 });
});

test("at the end of 1965", () => {
  assert.deepEqual(countAt(objs, dayOf(new Date("1965-12-31T00:00Z"))), { satellites: 208, rocketBodies: 100, debris: 1134, unknown: 0, total: 1442 });
});

test("on the day the first Starlinks launched, where the chapter ends", () => {
  assert.deepEqual(countAt(objs, dayOf(new Date("2019-05-24T00:00Z"))), { satellites: 5072, rocketBodies: 2026, debris: 12252, unknown: 28, total: 19378 });
});

test("the Fengyun-1C cloud appears with the 2007 test, not the 1999 launch", () => {
  assert.deepEqual(countAt(objs, dayOf(new Date("2007-01-10T00:00Z"))), { satellites: 3406, rocketBodies: 1624, debris: 5105, unknown: 1, total: 10136 });
  assert.deepEqual(countAt(objs, dayOf(new Date("2007-12-31T00:00Z"))), { satellites: 3479, rocketBodies: 1660, debris: 8703, unknown: 1, total: 13843 });
});

test("the chart's series agrees with countAt on every sampled day", () => {
  const days = [0, 1400, 5000, 12000, 18000, 22512];
  const s = seriesAt(objs, days);
  days.forEach((d, k) => {
    const c = countAt(objs, d);
    assert.deepEqual([s.satellites[k], s.rocketBodies[k], s.debris[k], s.total[k]], [c.satellites, c.rocketBodies, c.debris, c.total], `day ${d}`);
  });
});
