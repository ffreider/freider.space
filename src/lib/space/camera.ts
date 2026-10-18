import type { Shot } from "../../app/space/types.ts";

// Where the story's camera goes for a shot. Pure geometry, so it can be
// tested without a browser; the globe (src/app/space/globe.tsx) eases between
// these poses. The scene is in Earth radii in three.js axes: x toward 0°
// longitude, y toward the north pole, z toward 90° west.

export type Vec = [number, number, number];
type Place = { lat: number; lon: number };

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const scale = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k];
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// Camera distances in Earth radii. Close while everything is in low orbit,
// far enough for geostationary orbit (6.6) once Syncom 2 is up.
export const NEAR = 7;
export const FAR = 17;
export const CLOSE = 3.5;
export const WIDE = 18.5;
export const WIDE_FROM = 2121; // 26 July 1963, days since Sputnik
export const GEO_RADIUS = 42164.17 / 6378.137; // the geostationary ring, in Earth radii
export const GROUND = 1.0005; // a stander on the ground is 3 km out from the centre, to keep clear of the surface
export const ORBIT_FOV = 36;
export const SKY_FOV = 80;

// Unit vector toward a place on the ground.
export const toward = (lat: number, lon: number): Vec => [Math.cos(rad(lat)) * Math.cos(rad(lon)), Math.sin(rad(lat)), -Math.cos(rad(lat)) * Math.sin(rad(lon))];

// Up, east and north at a place on the ground.
export function localFrame(lat: number, lon: number): { up: Vec; east: Vec; north: Vec } {
  return {
    up: toward(lat, lon),
    east: [-Math.sin(rad(lon)), 0, -Math.cos(rad(lon))],
    north: [-Math.sin(rad(lat)) * Math.cos(rad(lon)), Math.cos(rad(lat)), Math.sin(rad(lat)) * Math.sin(rad(lon))],
  };
}

// The direction of an azimuth (from north, clockwise) and elevation at a place.
export function skyDirection(lat: number, lon: number, az: number, el: number): Vec {
  const { up, east, north } = localFrame(lat, lon);
  const flat = add(scale(north, Math.cos(rad(az))), scale(east, Math.sin(rad(az))));
  return add(scale(flat, Math.cos(rad(el))), scale(up, Math.sin(rad(el))));
}

// The distance at which a circle of this radius around the Earth's centre
// fits the screen. On wide screens the globe is moved a fifth of the width to
// the right to make room for the text, so only 60% of the half-width is left
// on that side.
export function fitDistance(radius: number, fov: number, aspect: number, shifted: boolean) {
  const t = Math.tan(rad(fov) / 2);
  return Math.max(radius / t, radius / (t * aspect * (shifted ? 0.6 : 1)));
}

// A wide lens for the sky: about 80° across on a landscape screen, and on a
// portrait one the same across the narrow side (up to a limit, past which the
// edges stretch too much).
export function skyFov(aspect: number) {
  if (aspect >= 1) return SKY_FOV;
  return Math.min(100, deg(2 * Math.atan(Math.tan(rad(SKY_FOV / 2)) / aspect)));
}

export type Pose = { eye: Vec; target: Vec; up: Vec; fov: number; sky: boolean };
export type PoseContext = {
  day: number;
  aspect: number;
  shifted: boolean; // the globe is set to the right of the text
  fallback: Place; // where to look when the shot names no focus
};

export function poseFor(shot: Shot, ctx: PoseContext): Pose {
  if (shot.kind === "sky") {
    const { lat, lon } = shot.place;
    const eye = scale(toward(lat, lon), GROUND);
    const look = skyDirection(lat, lon, shot.look.az, Math.min(shot.look.el, 85));
    return { eye, target: add(eye, look), up: toward(lat, lon), fov: skyFov(ctx.aspect), sky: true };
  }

  const at = shot.focus ?? ctx.fallback;
  let lat = 8 + at.lat * 0.6; // from slightly north of the equator, so the globe shows its tilt
  let distance = ctx.day >= WIDE_FROM ? FAR : NEAR;
  switch (shot.view) {
    case "close":
      lat = 3 + at.lat * 0.9;
      distance = CLOSE;
      break;
    case "wide":
      distance = WIDE;
      break;
    case "polar":
      // Nearly straight down on the pole; the last few degrees keep it a
      // globe rather than a flat disc, and keep "up" well defined.
      lat = 82;
      distance = fitDistance(GEO_RADIUS + 0.8, ORBIT_FOV, ctx.aspect, ctx.shifted);
      break;
    case "edge":
      lat = 1.5;
      distance = fitDistance(GEO_RADIUS + 1, ORBIT_FOV, ctx.aspect, ctx.shifted);
      break;
  }
  return { eye: scale(toward(lat, at.lon), distance), target: [0, 0, 0], up: [0, 1, 0], fov: ORBIT_FOV, sky: false };
}

// The sun's direction (a unit vector, in the scene's axes) when it stands
// `depression` degrees below the horizon at a place, in the evening, on a day
// when its declination is `dec`. Used for the sky shots, where the sun has to
// be down for the satellites to be lit against a dark ground. The date's real
// declination fixes which way along the horizon it set; where the sun never
// gets that low (the north in spring) it is placed due north instead.
export function sunBelow(lat: number, lon: number, dec: number, depression: number): Vec {
  const { up, east, north } = localFrame(lat, lon);
  const el = -rad(depression);
  const c = (Math.sin(rad(dec)) - Math.sin(rad(lat)) * Math.sin(el)) / (Math.cos(rad(lat)) * Math.cos(el));
  const A = 2 * Math.PI - Math.acos(clamp(c, -1, 1)); // in the evening it is in the west
  const flat = add(scale(north, Math.cos(A)), scale(east, Math.sin(A)));
  return add(scale(flat, Math.cos(el)), scale(up, Math.sin(el)));
}

// Orbit orientation that puts an object at a point over the ground: the
// right ascension of the ascending node, argument of latitude and so mean
// anomaly (for a near-circular orbit) of an orbit of this inclination that
// passes through `point`, a unit vector in the inertial frame (z along the
// Earth's axis). Pieces of one break-up all start here, bunched together.
// Where the point is further from the equator than the orbit reaches, the
// orbit's top is used instead.
export function bunchElements(point: Vec, inclination: number) {
  const lat = Math.asin(clamp(point[2], -1, 1));
  const ra = Math.atan2(point[1], point[0]);
  const si = Math.sin(inclination);
  const u = Math.asin(clamp(si > 1e-6 ? Math.sin(lat) / si : 0, -1, 1)); // argument of latitude, ascending branch
  const raan = ra - Math.atan2(Math.cos(inclination) * Math.sin(u), Math.cos(u));
  return { raan, argp: 0, m: u };
}
