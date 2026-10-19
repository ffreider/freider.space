import assert from "node:assert/strict";
import { test } from "node:test";
import { storyOrbit } from "./early.ts";

// Explorer 1 as SATCAT lists it (its orbit just before it fell in 1970) and
// as GCAT records it the day it launched.
const explorer = { perigee: 183, apogee: 215, incl: 33.15, period: 88.48, launchDay: 120, decayDay: 4561 };
const early = { perigee: 359, apogee: 2542, incl: 33.18, oDay: 120 };

test("an object that has fallen is drawn in its early orbit", () => {
  const o = storyOrbit(explorer, early);
  assert.deepEqual([o.perigee, o.apogee, o.incl], [359, 2542, 33.18]);
  // Period from Kepler's third law: about 114.8 minutes for this orbit.
  assert.ok(Math.abs(o.period - 114.8) < 0.5, `period ${o.period}`);
});

test("an object still in orbit keeps its catalogue orbit", () => {
  assert.deepEqual(storyOrbit({ ...explorer, decayDay: null }, early), { perigee: 183, apogee: 215, incl: 33.15, period: 88.48 });
});

test("an early orbit recorded long after launch, or incomplete, is not used", () => {
  assert.deepEqual(storyOrbit(explorer, { ...early, oDay: 120 + 400 }), { perigee: 183, apogee: 215, incl: 33.15, period: 88.48 });
  assert.deepEqual(storyOrbit(explorer, { ...early, apogee: NaN }), { perigee: 183, apogee: 215, incl: 33.15, period: 88.48 });
  assert.deepEqual(storyOrbit(explorer, undefined), { perigee: 183, apogee: 215, incl: 33.15, period: 88.48 });
});
