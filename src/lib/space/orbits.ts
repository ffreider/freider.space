import type { SpaceObject } from "./catalogue";

// Where an object is on its orbit. The catalogue gives each orbit's real
// size, shape and tilt (perigee, apogee, inclination) and its period; it
// doesn't give the orbit's orientation (RAAN, argument of perigee) or where
// along it the object is. Those come from a hash of the NORAD number, so
// they're the same for an object every time, spread evenly over all
// objects, and illustrative: the page says so.

const RE = 6378.137; // km
const MU = 398600.4418; // km³/s²
const TAU = 2 * Math.PI;

function hash(n: number, salt: number) {
  let h = (n * 0x9e3779b1 + salt * 0x85ebca77) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function elements(o: SpaceObject) {
  const rp = RE + Math.max(0, o.perigeeKm);
  const ra = RE + Math.max(0, o.apogeeKm, o.perigeeKm);
  const a = (rp + ra) / 2;
  const e = Math.min(0.99, (ra - rp) / (ra + rp));
  const n = o.periodMin > 0 ? TAU / (o.periodMin * 60) : Math.sqrt(MU / a ** 3);
  return {
    a,
    e,
    i: (o.inclinationDeg * Math.PI) / 180,
    raan: hash(o.norad, 1) * TAU,
    argp: hash(o.norad, 2) * TAU,
    m0: hash(o.norad, 3) * TAU,
    n,
  };
}

// Position in km at `seconds` after the story's reference time, in a frame
// with z along Earth's axis.
export function positionAt(o: SpaceObject, seconds: number): [number, number, number] {
  const { a, e, i, raan, argp, m0, n } = elements(o);
  const M = (m0 + n * seconds) % TAU;
  let E = M;
  for (let k = 0; k < 6; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const [cO, sO, cw, sw, ci, si] = [Math.cos(raan), Math.sin(raan), Math.cos(argp), Math.sin(argp), Math.cos(i), Math.sin(i)];
  return [
    (cO * cw - sO * sw * ci) * xp + (-cO * sw - sO * cw * ci) * yp,
    (sO * cw + cO * sw * ci) * xp + (-sO * sw + cO * cw * ci) * yp,
    sw * si * xp + cw * si * yp,
  ];
}
