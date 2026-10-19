import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { decodeCatalogue } from "../../lib/space/catalogue.ts";
import { CHAPTER1 } from "./chapter1.ts";

const file = readFileSync(new URL("../../../public/space/catalogue.bin", import.meta.url));
const norads = new Set(decodeCatalogue(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)).map((o) => o.norad));

test("the beats are in date order", () => {
  for (let k = 1; k < CHAPTER1.length; k++) assert.ok(CHAPTER1[k].date >= CHAPTER1[k - 1].date, `${CHAPTER1[k].id} comes before ${CHAPTER1[k - 1].id}`);
});

test("every beat cites at least one source over https", () => {
  for (const b of CHAPTER1) {
    assert.ok(b.sources.length >= 1, `${b.id} has no source`);
    for (const s of b.sources) assert.match(s.url, /^https:\/\//, `${b.id}: ${s.url}`);
  }
});

test("the chapter runs from Sputnik 1 to the first Starlinks", () => {
  assert.equal(CHAPTER1[0].date, "1957-10-04");
  assert.equal(CHAPTER1[CHAPTER1.length - 1].date, "2019-05-24");
});

test("every highlighted object is in the catalogue", () => {
  for (const b of CHAPTER1) for (const id of b.highlight ?? []) assert.ok(norads.has(id), `${b.id}: NORAD ${id} not in the snapshot`);
});
