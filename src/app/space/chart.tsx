"use client";

import { useMemo } from "react";
import type { SpaceObject } from "@/lib/space/catalogue";
import { seriesAt } from "@/lib/space/counts";
import styles from "./space.module.css";

// Objects in orbit over the whole chapter, stacked by kind, drawn only up to
// the story date so it grows as you read. Satellites at the bottom, then
// rocket stages, then debris. Sampled every 30 days from the same counts as
// the counter (seriesAt agrees with countAt).

const W = 240;
const H = 64;
const STEP = 30;

export function GrowthChart({ objs, day, from, to }: { objs: SpaceObject[]; day: number; from: number; to: number }) {
  const chart = useMemo(() => {
    const days: number[] = [];
    for (let d = from; d < to; d += STEP) days.push(d);
    days.push(to);
    const s = seriesAt(objs, days);
    const top = Math.ceil(Math.max(...s.total) / 5000) * 5000;
    const x = (d: number) => ((d - from) / (to - from)) * W;
    const y = (v: number) => H - (v / top) * H;
    const stacks = [s.satellites, s.satellites.map((v, k) => v + s.rocketBodies[k]), s.total];
    const area = (lower: number[] | null, upper: number[]) =>
      "M" +
      days.map((d, k) => `${x(d).toFixed(1)},${y(upper[k]).toFixed(1)}`).join("L") +
      "L" +
      days
        .map((d, k) => `${x(d).toFixed(1)},${y(lower ? lower[k] : 0).toFixed(1)}`)
        .reverse()
        .join("L") +
      "Z";
    return { top, x, bands: [area(null, stacks[0]), area(stacks[0], stacks[1]), area(stacks[1], stacks[2])] };
  }, [objs, from, to]);

  const edge = Math.max(0, Math.min(W, chart.x(day)));
  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H + 14}`} role="presentation">
      <defs>
        <clipPath id="space-chart-reveal">
          <rect x="0" y="0" width={edge} height={H} />
        </clipPath>
      </defs>
      <line x1="0" x2={W} y1={H + 0.5} y2={H + 0.5} className={styles.chartAxis} />
      <g clipPath="url(#space-chart-reveal)">
        {chart.bands.map((d, k) => (
          <path key={k} d={d} className={[styles.bandSat, styles.bandRb, styles.bandDeb][k]} />
        ))}
      </g>
      {edge > 0 && <line x1={edge} x2={edge} y1="0" y2={H} className={styles.chartCursor} />}
      <text x="0" y={H + 12} className={styles.chartLabel}>
        1957
      </text>
      <text x={W} y={H + 12} textAnchor="end" className={styles.chartLabel}>
        2019
      </text>
      <text x="0" y="8" className={styles.chartLabel}>
        {chart.top.toLocaleString("en-GB")}
      </text>
    </svg>
  );
}
