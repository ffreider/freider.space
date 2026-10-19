import assert from "node:assert/strict";
import { test } from "node:test";
import { eveningSky, gmstDegrees } from "./sidereal.ts";

test("sidereal time at J2000 is the published 280.46 degrees", () => {
  assert.ok(Math.abs(gmstDegrees(Date.UTC(2000, 0, 1, 12)) - 280.46061837) < 1e-6);
});

test("a sidereal day is a few minutes short of a solar one", () => {
  const a = gmstDegrees(Date.UTC(1969, 6, 16, 12));
  const b = gmstDegrees(Date.UTC(1969, 6, 17, 12));
  const gain = (b - a + 360) % 360;
  assert.ok(Math.abs(gain - 0.98564736629) < 1e-6);
});

test("it is always in range, before 1970 too", () => {
  for (const ms of [Date.UTC(1957, 9, 4), Date.UTC(1957, 9, 4, 18), Date.UTC(2019, 4, 24, 22)]) {
    const g = gmstDegrees(ms);
    assert.ok(g >= 0 && g < 360);
  }
});

test("the evening sky at Moscow on Sputnik's day is a sensible angle, and later at night than at dusk", () => {
  const dusk = eveningSky(0, 37.62, "dusk");
  const night = eveningSky(0, 37.62, "night");
  assert.ok(dusk >= 0 && dusk < 2 * Math.PI);
  const turned = ((night - dusk + 2 * Math.PI) % (2 * Math.PI)) * (180 / Math.PI);
  assert.ok(Math.abs(turned - 3.5 * 15.0411) < 0.01); // 3.5 hours of sidereal turning
});

test("ten degrees east is forty minutes earlier in the same evening", () => {
  const a = eveningSky(100, 0, "dusk");
  const b = eveningSky(100, 10, "dusk");
  const turned = ((a - b + 2 * Math.PI) % (2 * Math.PI)) * (180 / Math.PI);
  assert.ok(Math.abs(turned - 10 * 1.0027379) < 0.01);
});
