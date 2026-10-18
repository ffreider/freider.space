import type { SpaceObject } from "./catalogue";

// How many objects were in orbit on a day: launched on or before it, and
// not yet fallen back. The story's counter and every count in its text come
// from this, so they can't disagree.

export type Counts = { satellites: number; rocketBodies: number; debris: number; unknown: number; total: number };

export function countAt(objs: SpaceObject[], day: number): Counts {
  const c: Counts = { satellites: 0, rocketBodies: 0, debris: 0, unknown: 0, total: 0 };
  for (const o of objs) {
    if (o.launchDay > day || (o.decayDay !== null && o.decayDay <= day)) continue;
    if (o.kind === 0) c.satellites++;
    else if (o.kind === 1) c.rocketBodies++;
    else if (o.kind === 2) c.debris++;
    else c.unknown++;
    c.total++;
  }
  return c;
}
