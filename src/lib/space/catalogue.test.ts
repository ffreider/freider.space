import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeCatalogue, dayOf, encodeCatalogue, EPOCH, type SpaceObject } from "./catalogue.ts";

const sputnik: SpaceObject = { norad: 2, launchDay: 0, decayDay: 91, kind: 0, perigeeKm: 64, apogeeKm: 1080, inclinationDeg: 65, periodMin: 96.1 };
const vanguard: SpaceObject = { norad: 5, launchDay: 164, decayDay: null, kind: 0, perigeeKm: 654, apogeeKm: 3969, inclinationDeg: 34.25, periodMin: 132.75 };

test("days count from Sputnik's launch", () => {
  assert.equal(EPOCH, Date.UTC(1957, 9, 4));
  assert.equal(dayOf(new Date("1957-10-04T00:00Z")), 0);
  assert.equal(dayOf(new Date("2019-05-24T00:00Z")), 22512);
});

test("objects survive a round trip through the binary", () => {
  const [a, b] = decodeCatalogue(encodeCatalogue([sputnik, vanguard]));
  assert.deepEqual({ ...a, apogeeKm: Math.round(a.apogeeKm), perigeeKm: Math.round(a.perigeeKm) }, { ...sputnik, inclinationDeg: a.inclinationDeg, periodMin: a.periodMin });
  assert.ok(Math.abs(a.periodMin - 96.1) < 1e-4);
  assert.equal(b.decayDay, null);
  assert.equal(b.launchDay, 164);
  assert.ok(Math.abs(b.inclinationDeg - 34.25) < 1e-4);
});

test("each object takes 24 bytes", () => {
  assert.equal(encodeCatalogue([sputnik, vanguard]).byteLength, 8 + 2 * 24);
});

test("the kind survives alongside large catalogue numbers", () => {
  const [o] = decodeCatalogue(encodeCatalogue([{ ...vanguard, norad: 101074, kind: 3 }]));
  assert.deepEqual([o.norad, o.kind], [101074, 3]);
});

test("anything else is refused", () => {
  const other = encodeCatalogue([sputnik]);
  new DataView(other).setUint32(0, 0x12345678, true);
  assert.throws(() => decodeCatalogue(other), /not a space catalogue/);
});

test("a cut-off download is refused, not half read", () => {
  assert.throws(() => decodeCatalogue(encodeCatalogue([sputnik, vanguard]).slice(0, 8 + 30)), /incomplete/);
});
