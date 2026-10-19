import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { decodeCatalogue } from "./catalogue.ts";
import { fillTokens } from "./tokens.ts";

const file = readFileSync(new URL("../../../public/space/catalogue.bin", import.meta.url));
const objs = decodeCatalogue(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));

test("counts, in total and by kind, with thousands separators", () => {
  assert.equal(fillTokens("{count:2007-01-10}", objs), "10,136");
  assert.equal(fillTokens("{count:2007-01-10:debris} of {count:2007-01-10}", objs), "5,105 of 10,136");
  assert.equal(fillTokens("{count:1957-12-31}", objs), "2");
});

test("text without tokens is left alone", () => {
  assert.equal(fillTokens("Nothing here, {braces} or not.", objs), "Nothing here, {braces} or not.");
});

// Expected values counted separately: python reading the catalogue bytes,
// Vanguard 1 (NORAD 5) launched on day 164 (17 March 1958), period 132.59
// minutes, floor((day - 164) * 1440 / period) with day counted from
// 4 October 1957 (15,041 / 46,776 / 126,112 / 193,545 / 242,711), then
// rounded to three significant figures.
test("Vanguard 1's orbits to the end of each act, to three significant figures", () => {
  assert.equal(fillTokens("{orbits:5:1961-12-31}", objs), "15,000");
  assert.equal(fillTokens("{orbits:5:1969-12-31}", objs), "46,800");
  assert.equal(fillTokens("{orbits:5:1989-12-31}", objs), "126,000");
  assert.equal(fillTokens("{orbits:5:2006-12-31}", objs), "194,000");
  assert.equal(fillTokens("{orbits:5:2019-05-24}", objs), "243,000");
});

test("a token that can't be filled throws", () => {
  assert.throws(() => fillTokens("{count:2007-01-10:fish}", objs), /unknown kind/);
  assert.throws(() => fillTokens("{orbits:99999999:2007-01-10}", objs), /no object/);
  assert.throws(() => fillTokens("{orbits:5:1958-01-01}", objs), /not launched/);
  assert.throws(() => fillTokens("{orbits:1:2019-05-24}", objs), /already fallen/);
});
