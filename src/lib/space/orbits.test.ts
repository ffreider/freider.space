import assert from "node:assert/strict";
import { test } from "node:test";
import type { SpaceObject } from "./catalogue.ts";
import { elements, positionAt } from "./orbits.ts";

const RE = 6378.137;
const vanguard: SpaceObject = { norad: 5, launchDay: 164, decayDay: null, kind: 0, perigeeKm: 654, apogeeKm: 3969, inclinationDeg: 34.25, periodMin: 132.75 };

test("an object stays between its perigee and apogee, within its tilt", () => {
  const T = vanguard.periodMin * 60;
  const zMax = (RE + vanguard.apogeeKm) * Math.sin((vanguard.inclinationDeg * Math.PI) / 180) + 1;
  for (let k = 0; k < 200; k++) {
    const [x, y, z] = positionAt(vanguard, (k / 200) * T);
    const r = Math.hypot(x, y, z);
    assert.ok(r >= RE + vanguard.perigeeKm - 1 && r <= RE + vanguard.apogeeKm + 1, `radius ${r} out of range`);
    assert.ok(Math.abs(z) <= zMax, `z ${z} beyond the inclination`);
  }
});

test("it comes back after one period", () => {
  const T = vanguard.periodMin * 60;
  const a = positionAt(vanguard, 1000);
  const b = positionAt(vanguard, 1000 + T);
  assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1);
});

test("the illustrative orientation is the same every time for the same object", () => {
  assert.deepEqual(elements(vanguard), elements({ ...vanguard }));
  assert.notEqual(elements(vanguard).raan, elements({ ...vanguard, norad: 6 }).raan);
});

test("odd catalogue values never give a non-number position", () => {
  const odd: SpaceObject = { ...vanguard, norad: 9, perigeeKm: 0, apogeeKm: 0, periodMin: 0 };
  assert.ok(positionAt(odd, 500).every(Number.isFinite));
});
