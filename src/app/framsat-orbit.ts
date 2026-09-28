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

const EARTH_RADIUS_KM = 6378.135; // the value the SGP4 model uses
const deg = Math.PI / 180;
const observer = {
  latitude: TRONDHEIM.lat * deg,
  longitude: TRONDHEIM.lon * deg,
  height: 0.05, // km
};

type Vec = { x: number; y: number; z: number };

export type SatState = {
  lat: number;
  lon: number;
  altitude: number; // km
  speed: number; // km/h
  sunlit: boolean;
  elevation: number; // degrees above Trondheim's horizon (negative = below)
  time: number; // ms timestamp this state is for
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

export function stateAt(satrec: SatRec, date: Date): SatState | null {
  const { position, velocity } = propagate(satrec, date);
  // The orbit model reports failure (e.g. a stale TLE) as `false`.
  if (typeof position !== "object" || typeof velocity !== "object") return null;
  const gmst = gstime(date);
  const geo = eciToGeodetic(position, gmst);
  const look = ecfToLookAngles(observer, eciToEcf(position, gmst));
  return {
    lat: degreesLat(geo.latitude),
    lon: degreesLong(geo.longitude),
    altitude: geo.height,
    speed: Math.hypot(velocity.x, velocity.y, velocity.z) * 3600,
    sunlit: isSunlit(position, date),
    elevation: look.elevation / deg,
    time: date.getTime(),
  };
}

function elevationAt(satrec: SatRec, date: Date) {
  const { position } = propagate(satrec, date);
  if (typeof position !== "object") return -90;
  return ecfToLookAngles(observer, eciToEcf(position, gstime(date))).elevation / deg;
}

export type Pass = { start: Date; end: Date; peak: Date; maxElevation: number };

// The next time FramSat-1 rises at least `minElevation` degrees above
// Trondheim's horizon (or the pass happening right now), within two days.
export function nextPass(satrec: SatRec, from: Date, minElevation = 10): Pass | null {
  const stepMs = 20_000;
  const endMs = from.getTime() + 2 * 86_400_000;
  let pass: Pass | null = null;

  for (let t = from.getTime(); t < endMs; t += stepMs) {
    const date = new Date(t);
    const elevation = elevationAt(satrec, date);
    if (elevation >= minElevation) {
      if (!pass) pass = { start: date, end: date, peak: date, maxElevation: elevation };
      pass.end = date;
      if (elevation > pass.maxElevation) {
        pass.maxElevation = elevation;
        pass.peak = date;
      }
    } else if (pass) {
      return pass;
    }
  }
  return pass;
}

const EARTH_MU = 398600.4418; // km³/s², Earth's gravitational parameter

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
