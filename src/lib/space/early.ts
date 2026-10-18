// Which orbit to draw an object in. SATCAT gives each object's latest
// orbit, which for an object that has since fallen is its orbit just before
// re-entry: Explorer 1 would circle at 200 km in 1958 instead of reaching
// 2,500 km, and the first Starlinks would sit at 150 km on their launch
// day. So for fallen objects we use the early orbit Jonathan McDowell's
// GCAT records (CC BY 4.0), when it was taken within a year of launch.
// Objects still in orbit keep the catalogue's current orbit.

const RE = 6378.137; // km
const MU = 398600.4418; // km³/s²
const WITHIN = 365; // days after launch

export type Orbit = { perigee: number; apogee: number; incl: number; period: number };
export type Early = { perigee: number; apogee: number; incl: number; oDay: number };

export function storyOrbit(o: Orbit & { launchDay: number; decayDay: number | null }, early: Early | undefined): Orbit {
  const own = { perigee: o.perigee, apogee: o.apogee, incl: o.incl, period: o.period };
  if (o.decayDay === null || !early) return own;
  if (![early.perigee, early.apogee, early.incl, early.oDay].every(Number.isFinite)) return own;
  if (early.oDay - o.launchDay > WITHIN || early.apogee < early.perigee) return own;
  const a = RE + (early.perigee + early.apogee) / 2;
  return { perigee: early.perigee, apogee: early.apogee, incl: early.incl, period: (2 * Math.PI * Math.sqrt(a ** 3 / MU)) / 60 };
}
