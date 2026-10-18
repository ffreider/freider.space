import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { decodeCatalogue, dayOf } from "./catalogue.ts";
import { countAt } from "./counts.ts";

// The real snapshot; the expected numbers were counted independently
// (pandas, same filtering rules as scripts/space-catalogue.mjs).
const file = readFileSync(new URL("../../../public/space/catalogue.bin", import.meta.url));
const objs = decodeCatalogue(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));

test("at the end of 1957 two objects were up: Sputnik 1 and 2", () => {
  assert.deepEqual(countAt(objs, dayOf(new Date("1957-12-31T00:00Z"))), { satellites: 2, rocketBodies: 0, debris: 0, unknown: 0, total: 2 });
});

test("at the end of 1965", () => {
  assert.deepEqual(countAt(objs, dayOf(new Date("1965-12-31T00:00Z"))), { satellites: 208, rocketBodies: 100, debris: 1708, unknown: 0, total: 2016 });
});

test("at the end of 2019", () => {
  assert.deepEqual(countAt(objs, dayOf(new Date("2019-12-31T00:00Z"))), { satellites: 5325, rocketBodies: 2060, debris: 15998, unknown: 34, total: 23417 });
});
