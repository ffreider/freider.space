import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeCatalogue, dayOf, EPOCH, type SpaceObject } from "./catalogue.ts";

// A tiny encoder for the test, matching the documented layout.
function encode(objs: SpaceObject[], magic = 0x53504331) {
  const buf = new ArrayBuffer(8 + 32 * objs.length);
  const v = new DataView(buf);
  v.setUint32(0, magic, true);
  v.setUint32(4, objs.length, true);
  objs.forEach((o, i) => {
    const p = 8 + 32 * i;
    v.setUint32(p, o.norad, true);
    v.setUint16(p + 4, o.launchDay, true);
    v.setUint16(p + 6, o.decayDay ?? 0xffff, true);
    v.setUint8(p + 8, o.kind);
    v.setFloat32(p + 12, o.perigeeKm, true);
    v.setFloat32(p + 16, o.apogeeKm, true);
    v.setFloat32(p + 20, o.inclinationDeg, true);
    v.setFloat32(p + 24, o.periodMin, true);
  });
  return buf;
}

const sputnik: SpaceObject = { norad: 2, launchDay: 0, decayDay: 91, kind: 0, perigeeKm: 64, apogeeKm: 1080, inclinationDeg: 65, periodMin: 96.1 };
const vanguard: SpaceObject = { norad: 5, launchDay: 164, decayDay: null, kind: 0, perigeeKm: 654, apogeeKm: 3969, inclinationDeg: 34.25, periodMin: 132.75 };

test("days count from Sputnik's launch", () => {
  assert.equal(EPOCH, Date.UTC(1957, 9, 4));
  assert.equal(dayOf(new Date("1957-10-04T00:00Z")), 0);
  assert.equal(dayOf(new Date("2019-05-24T00:00Z")), 22512);
});

test("objects survive a round trip through the binary", () => {
  const [a, b] = decodeCatalogue(encode([sputnik, vanguard]));
  assert.deepEqual({ ...a, apogeeKm: Math.round(a.apogeeKm), perigeeKm: Math.round(a.perigeeKm) }, { ...sputnik, inclinationDeg: a.inclinationDeg, periodMin: a.periodMin });
  assert.ok(Math.abs(a.periodMin - 96.1) < 1e-4);
  assert.equal(b.decayDay, null);
  assert.equal(b.launchDay, 164);
  assert.ok(Math.abs(b.inclinationDeg - 34.25) < 1e-4);
});

test("anything else is refused", () => {
  assert.throws(() => decodeCatalogue(encode([sputnik], 0x12345678)), /not a space catalogue/);
});
