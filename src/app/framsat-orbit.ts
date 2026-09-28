import {
  degreesLat,
  degreesLong,
  eciToEcf,
  eciToGeodetic,
  ecfToLookAngles,
  gstime,
  propagate,
  type SatRec,
} from "satellite.js";

// Orbit calculations for FramSat-1, all done locally from its TLE.

export const TRONDHEIM = { lat: 63.4305, lon: 10.3951 };
export const LAUNCH = new Date("2026-09-05T20:12:00Z"); // per SatNOGS

// FramSat-1's downlink, per SatNOGS: UHF, FSK 9600 baud, AX.25 (G3RUH).
export const DOWNLINK_HZ = 435_141_000;

const EARTH_RADIUS_KM = 6378.135; // the value the SGP4 model uses
const EARTH_MU = 398600.4418; // km³/s², Earth's gravitational parameter
const LIGHT_KM_S = 299_792.458;
const deg = Math.PI / 180;
const observer = {
  latitude: TRONDHEIM.lat * deg,
  longitude: TRONDHEIM.lon * deg,
  height: 0.05, // km
};

type Vec = { x: number; y: number; z: number };

export type SatState = {
  time: number; // ms timestamp this state is for
  lat: number;
  lon: number;
  altitude: number; // km
  speed: number; // km/h
  sunlit: boolean;
  // Position and velocity in the TEME inertial frame SGP4 works in.
  position: Vec; // km
  velocity: Vec; // km/s
  // As seen from Trondheim.
  azimuth: number; // degrees from north
  elevation: number; // degrees above the horizon (negative = below)
  range: number; // km, straight-line distance
  rangeRate: number; // km/s, positive = moving away
};

// Unit vector from Earth toward the Sun, in the same inertial frame as the
// satellite's position. Low-precision formula, accurate to about 0.01°.
function sunDirection(date: Date): Vec {
  const n = date.getTime() / 86400000 + 2440587.5 - 2451545.0; // days since J2000
  const meanLong = (280.46 + 0.9856474 * n) * deg;
  const anomaly = (357.528 + 0.9856003 * n) * deg;
  const eclipticLong =
    meanLong + (1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * deg;
  const obliquity = (23.439 - 0.0000004 * n) * deg;
  return {
    x: Math.cos(eclipticLong),
    y: Math.cos(obliquity) * Math.sin(eclipticLong),
    z: Math.sin(obliquity) * Math.sin(eclipticLong),
  };
}

// The point on Earth where the Sun is straight overhead, as [lon, lat].
export function subsolarPoint(date: Date): [number, number] {
  const sun = sunDirection(date);
  const rightAscension = Math.atan2(sun.y, sun.x);
  const declination = Math.asin(sun.z);
  const lon = (rightAscension - gstime(date)) / deg;
  return [((lon + 540) % 360) - 180, declination / deg];
}

// Whether the satellite is in sunlight, treating Earth's shadow as a cylinder.
function isSunlit(position: Vec, date: Date) {
  const sun = sunDirection(date);
  const along = position.x * sun.x + position.y * sun.y + position.z * sun.z;
  if (along > 0) return true; // on the day side
  const perp = Math.hypot(
    position.x - along * sun.x,
    position.y - along * sun.y,
    position.z - along * sun.z,
  );
  return perp > EARTH_RADIUS_KM;
}

function eci(satrec: SatRec, date: Date) {
  const { position, velocity } = propagate(satrec, date);
  // The orbit model reports failure (e.g. a stale TLE) as `false`.
  if (typeof position !== "object" || typeof velocity !== "object") return null;
  return { position, velocity };
}

function look(position: Vec, date: Date) {
  const angles = ecfToLookAngles(observer, eciToEcf(position, gstime(date)));
  return {
    azimuth: angles.azimuth / deg,
    elevation: angles.elevation / deg,
    range: angles.rangeSat,
  };
}

export function stateAt(satrec: SatRec, date: Date): SatState | null {
  const now = eci(satrec, date);
  const later = eci(satrec, new Date(date.getTime() + 1000));
  if (!now || !later) return null;
  const geo = eciToGeodetic(now.position, gstime(date));
  const seen = look(now.position, date);
  const { x, y, z } = now.velocity;
  return {
    time: date.getTime(),
    lat: degreesLat(geo.latitude),
    lon: degreesLong(geo.longitude),
    altitude: geo.height,
    speed: Math.hypot(x, y, z) * 3600,
    sunlit: isSunlit(now.position, date),
    position: now.position,
    velocity: now.velocity,
    ...seen,
    // How fast the distance to Trondheim is changing, over one second.
    rangeRate: look(later.position, new Date(date.getTime() + 1000)).range - seen.range,
  };
}

// The Doppler shift a receiver in Trondheim hears on the downlink, in Hz.
export const dopplerHz = (rangeRate: number) => (-DOWNLINK_HZ * rangeRate) / LIGHT_KM_S;

export type Pass = {
  start: Date;
  end: Date;
  peak: Date;
  maxElevation: number;
  // Where it is in Trondheim's sky during the pass: [azimuth, elevation].
  sky: [number, number][];
};

// The next `count` passes over Trondheim (including one happening now) that
// climb at least `minPeak` degrees, looking up to `days` ahead.
export function upcomingPasses(
  satrec: SatRec,
  from: Date,
  count = 5,
  minPeak = 5,
  days = 3,
): Pass[] {
  const stepMs = 20_000;
  const endMs = from.getTime() + days * 86_400_000;
  const passes: Pass[] = [];
  let pass: Pass | null = null;

  for (let t = from.getTime(); t < endMs && passes.length < count; t += stepMs) {
    const date = new Date(t);
    const state = eci(satrec, date);
    const seen = state ? look(state.position, date) : null;
    if (seen && seen.elevation > 0) {
      pass ??= { start: date, end: date, peak: date, maxElevation: -90, sky: [] };
      pass.end = date;
      pass.sky.push([seen.azimuth, seen.elevation]);
      if (seen.elevation > pass.maxElevation) {
        pass.maxElevation = seen.elevation;
        pass.peak = date;
      }
    } else if (pass) {
      if (pass.maxElevation >= minPeak) passes.push(pass);
      pass = null;
    }
  }
  return passes;
}

// Where it has been and where it's going, as [longitude, latitude] points
// one minute apart, for drawing on the globe.
export function groundTrack(satrec: SatRec, center: Date, minutes = 50) {
  const past: [number, number][] = [];
  const future: [number, number][] = [];
  for (let m = -minutes; m <= minutes; m++) {
    const date = new Date(center.getTime() + m * 60_000);
    const state = eci(satrec, date);
    if (!state) continue;
    const geo = eciToGeodetic(state.position, gstime(date));
    const point: [number, number] = [degreesLong(geo.longitude), degreesLat(geo.latitude)];
    if (m <= 0) past.push(point);
    if (m >= 0) future.push(point);
  }
  return { past, future };
}

export function orbitFacts(satrec: SatRec, tleLine2: string) {
  const periodMinutes = (2 * Math.PI) / satrec.no; // `no` is radians per minute
  // Kepler's third law: orbit size from how fast it goes round.
  const semiMajorAxisKm = Math.cbrt(EARTH_MU / (satrec.no / 60) ** 2);
  return {
    periodMinutes,
    orbitsPerDay: 1440 / periodMinutes,
    inclination: satrec.inclo / deg,
    perigeeKm: semiMajorAxisKm * (1 - satrec.ecco) - EARTH_RADIUS_KM,
    apogeeKm: semiMajorAxisKm * (1 + satrec.ecco) - EARTH_RADIUS_KM,
    semiMajorAxisKm,
    // Julian date of the TLE, and the revolution count at that moment.
    epoch: new Date((satrec.jdsatepoch - 2440587.5) * 86_400_000),
    revAtEpoch: Number(tleLine2.slice(63, 68)),
  };
}
