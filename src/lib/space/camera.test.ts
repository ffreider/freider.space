import assert from "node:assert/strict";
import { test } from "node:test";
import { bunchElements, CLOSE, FAR, fitDistance, GEO_RADIUS, GROUND, localFrame, NEAR, poseFor, skyDirection, skyFov, sunBelow, toward, WIDE_FROM, type Vec } from "./camera.ts";

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: Vec) => Math.hypot(a[0], a[1], a[2]);
const near = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} is not ${b}`);
const ctx = { day: 0, aspect: 1.6, shifted: true, fallback: { lat: 20, lon: 40 } };

test("up, east and north at a place are a right-handed set of unit vectors", () => {
  for (const [lat, lon] of [[55.75, 37.62], [-33, 151], [69.31, 16.12], [0, 0]]) {
    const { up, east, north } = localFrame(lat, lon);
    for (const v of [up, east, north]) near(len(v), 1);
    near(dot(up, east), 0);
    near(dot(up, north), 0);
    near(dot(east, north), 0);
    // east x north = up
    const c: Vec = [east[1] * north[2] - east[2] * north[1], east[2] * north[0] - east[0] * north[2], east[0] * north[1] - east[1] * north[0]];
    for (let k = 0; k < 3; k++) near(c[k], up[k]);
  }
});

test("north points toward the pole and east toward larger longitude", () => {
  const { north, east } = localFrame(10, 20);
  assert.ok(north[1] > 0);
  // A little way east is a little more east longitude, i.e. toward() of lon + 1.
  const step = toward(10, 21), here = toward(10, 20);
  assert.ok(dot([step[0] - here[0], step[1] - here[1], step[2] - here[2]], east) > 0);
});

test("a sky shot stands on the ground with up as the local vertical", () => {
  const pose = poseFor({ kind: "sky", place: { name: "Oslo", lat: 59.91, lon: 10.75 }, look: { az: 180, el: 20 }, light: "dusk" }, ctx);
  assert.ok(pose.sky);
  near(len(pose.eye), GROUND);
  const up = toward(59.91, 10.75);
  for (let k = 0; k < 3; k++) near(pose.up[k], up[k]);
  const look: Vec = [pose.target[0] - pose.eye[0], pose.target[1] - pose.eye[1], pose.target[2] - pose.eye[2]];
  near(len(look), 1);
  near(dot(look, up), Math.sin((20 * Math.PI) / 180)); // 20° up
  assert.ok(dot(look, localFrame(59.91, 10.75).north) < 0); // looking south
});

test("azimuth 90 looks east", () => {
  const d = skyDirection(40, -74, 90, 0);
  const { east } = localFrame(40, -74);
  near(dot(d, east), 1);
});

test("the sky lens stays wide on a portrait screen", () => {
  assert.equal(skyFov(1.7), 80);
  assert.ok(skyFov(0.46) > 80 && skyFov(0.46) <= 100);
});

test("orbit distances: close before 26 July 1963, far after, close view at 3.5", () => {
  const view = (day: number, v: "default" | "close" | "wide") => len(poseFor({ kind: "orbit", view: v }, { ...ctx, day }).eye);
  near(view(WIDE_FROM - 1, "default"), NEAR);
  near(view(WIDE_FROM, "default"), FAR);
  near(view(0, "close"), CLOSE);
  assert.ok(view(0, "wide") >= 17 && view(0, "wide") <= 20);
});

test("polar looks down on the pole and edge sits in the equatorial plane, both outside the geostationary ring", () => {
  const polar = poseFor({ kind: "orbit", view: "polar" }, ctx);
  assert.ok(polar.eye[1] / len(polar.eye) > 0.98);
  assert.ok(len(polar.eye) > GEO_RADIUS + 3);
  const edge = poseFor({ kind: "orbit", view: "edge", focus: { lat: 0, lon: -55 } }, ctx);
  assert.ok(Math.abs(edge.eye[1]) / len(edge.eye) < 0.05);
  assert.ok(len(edge.eye) > GEO_RADIUS + 3);
});

test("on a portrait phone the ring still fits", () => {
  const d = fitDistance(GEO_RADIUS + 1, 36, 0.46, false);
  // half-width at that distance covers the ring's radius
  assert.ok(Math.tan((36 * Math.PI) / 360) * d * 0.46 >= GEO_RADIUS + 1 - 1e-9);
});

test("without a focus a shot keeps looking where the camera was", () => {
  const pose = poseFor({ kind: "orbit", view: "default" }, { ...ctx, fallback: { lat: 0, lon: 90 } });
  const dir = pose.eye.map((v) => v / len(pose.eye));
  assert.ok(dir[2] < -0.9); // 90° east is -z
});

test("the sun is below the horizon by the asked depth, and in the west", () => {
  for (const [lat, lon, dec, dep] of [[55.75, 37.62, -4, 10], [40.39, -74.18, 15, 18], [52.16, 4.49, 20, 10]]) {
    const { up, east } = localFrame(lat, lon);
    const sun = sunBelow(lat, lon, dec, dep);
    near(len(sun), 1);
    near(dot(sun, up), -Math.sin((dep * Math.PI) / 180), 1e-9);
    assert.ok(dot(sun, east) < 0, "sun sets in the west");
  }
});

test("the sun is still below the horizon where it can't reach that depth", () => {
  const { up } = localFrame(69.31, 16.12);
  assert.ok(dot(sunBelow(69.31, 16.12, 12, 10), up) < 0);
});

test("a break-up's bunch point lies on the orbit and over the chosen spot", () => {
  const point: Vec = [0.6, 0.3, 0.74];
  const n = len(point);
  const p = point.map((v) => v / n) as Vec;
  const inc = (98.6 * Math.PI) / 180;
  const { raan, argp, m } = bunchElements(p, inc);
  assert.equal(argp, 0);
  // Circular orbit: position at argument of latitude m, rotated into place.
  const x = Math.cos(m), y = Math.sin(m);
  const pos: Vec = [
    Math.cos(raan) * x - Math.sin(raan) * Math.cos(inc) * y,
    Math.sin(raan) * x + Math.cos(raan) * Math.cos(inc) * y,
    Math.sin(inc) * y,
  ];
  // Reachable (latitude 48° is inside an orbit tilted 98.6°), so it should land on the point.
  for (let k = 0; k < 3; k++) near(pos[k], p[k], 1e-9);
});
