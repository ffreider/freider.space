import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { decodeCatalogue, dayOf } from "./catalogue.ts";
import { countAt } from "./counts.ts";

// The real snapshot; the expected numbers were counted independently
// (pandas, same filtering and debris-dating rules as scripts/space-catalogue.mjs
// and appear.ts, written separately).
const file = readFileSync(new URL("../../../public/space/catalogue.bin", import.meta.url));
const objs = decodeCatalogue(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));

test("at the end of 1957 two objects were up: Sputnik 1 and 2", () => {
  assert.deepEqual(countAt(objs, dayOf(new Date("1957-12-31T00:00Z"))), { satellites: 2, rocketBodies: 0, debris: 0, unknown: 0, total: 2 });
});

test("at the end of 1965", () => {
  assert.deepEqual(countAt(objs, dayOf(new Date("1965-12-31T00:00Z"))), { satellites: 208, rocketBodies: 100, debris: 1477, unknown: 0, total: 1785 });
});

test("at the end of 2019", () => {
  assert.deepEqual(countAt(objs, dayOf(new Date("2019-12-31T00:00Z"))), { satellites: 5325, rocketBodies: 2060, debris: 15968, unknown: 34, total: 23387 });
});

test("the Fengyun-1C cloud appears with the 2007 test, not the 1999 launch", () => {
  assert.deepEqual(countAt(objs, dayOf(new Date("2007-01-10T00:00Z"))), { satellites: 3406, rocketBodies: 1624, debris: 11225, unknown: 1, total: 16256 });
  assert.deepEqual(countAt(objs, dayOf(new Date("2007-12-31T00:00Z"))), { satellites: 3479, rocketBodies: 1660, debris: 14781, unknown: 1, total: 19921 });
});
