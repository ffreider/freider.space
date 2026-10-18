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

// The same counts on many days at once, for the chart: one pass over the
// objects (each adds one on its launch day and takes one away on its decay
// day), then running sums. Agrees with countAt on every day.
export function seriesAt(objs: SpaceObject[], days: number[]) {
  const last = Math.max(0, ...days) + 1;
  const diff = [0, 1, 2, 3].map(() => new Int32Array(last + 1));
  for (const o of objs) {
    if (o.launchDay >= last) continue;
    diff[o.kind][o.launchDay]++;
    if (o.decayDay !== null && o.decayDay < last) diff[o.kind][Math.max(o.launchDay, o.decayDay)]--;
  }
  const running = diff.map((d) => {
    const r = new Int32Array(last);
    for (let k = 0, sum = 0; k < last; k++) r[k] = sum += d[k];
    return r;
  });
  const at = (kind: number) => days.map((d) => (d < 0 ? 0 : running[kind][d]));
  const [satellites, rocketBodies, debris, unknown] = [0, 1, 2, 3].map(at);
  return { satellites, rocketBodies, debris, unknown, total: days.map((_, k) => satellites[k] + rocketBodies[k] + debris[k] + unknown[k]) };
}
