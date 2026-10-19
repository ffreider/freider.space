// Which way the stars face from a place on a given evening, so the
// constellations in the ground shots are the ones that were up there.

const J2000 = Date.UTC(2000, 0, 1, 12); // 2000-01-01 12:00 UT
const SPUTNIK = Date.UTC(1957, 9, 4);

// Greenwich mean sidereal time at a UTC moment, in degrees (0 to 360).
export function gmstDegrees(utcMs: number) {
  const days = (utcMs - J2000) / 86_400_000;
  const g = (280.46061837 + 360.98564736629 * days) % 360;
  return g < 0 ? g + 360 : g;
}

// The sidereal angle, in radians, at the evening of a story day (days since
// Sputnik's launch) at a longitude: the local mean solar time is taken as
// 18:30 at dusk and 22:00 at night.
export function eveningSky(day: number, lon: number, light: "dusk" | "night") {
  const hour = light === "dusk" ? 18.5 : 22;
  const utc = SPUTNIK + Math.floor(day) * 86_400_000 + (hour - lon / 15) * 3_600_000;
  return (gmstDegrees(utc) * Math.PI) / 180;
}
