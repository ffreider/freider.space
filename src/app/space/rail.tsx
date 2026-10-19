"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { subscribe } from "./scroll-store";
import styles from "./space.module.css";

// Where you are in the chapter: the five acts as segments of a thin rail
// (a bar across the top on phones), filled as you read, with the next beat's
// title faintly beside it. It only gets ids and titles, never the text.
// Decorative: the article itself carries the same order for everything else.

type RailAct = { numeral: string; title: string; before: string };
type RailBeat = { id: string; title: string };

export function Rail({ acts, beats }: { acts: RailAct[]; beats: RailBeat[] }) {
  // Segment k runs from its act's first beat up to the next act's.
  const segments = useMemo(() => {
    const starts = acts.map((a) => beats.findIndex((b) => b.id === a.before)).filter((i) => i >= 0);
    const bounds = starts.length ? [0, ...starts.slice(1)] : [0];
    return bounds.map((start, k) => ({ start, end: bounds[k + 1] ?? beats.length, act: starts.length ? acts[k] : null }));
  }, [acts, beats]);

  // index: the beat across the middle of the screen (-1 before the first);
  // local: how far through it; act: the act whose card or beats are the
  // latest to have reached the middle of the screen.
  const [at, setAt] = useState({ index: -1, local: 0, on: false, act: -1 });

  useEffect(
    () =>
      subscribe(({ mid, height, beats: boxes, acts: cards, cold }) => {
        let index = -1;
        let local = 0;
        for (let k = 0; k < boxes.length; k++) {
          if (boxes[k].top > mid) break;
          index = k;
          local = Math.max(0, Math.min(1, (mid - boxes[k].top) / Math.max(1, boxes[k].height)));
        }
        // An act's card comes before its first beat, so the label changes
        // when the card reaches the middle, not when the beat does.
        let act = segments.findIndex((s) => index >= s.start && index < s.end);
        for (let k = cards.length - 1; k > act; k--) {
          if (cards[k].top <= mid) {
            act = k;
            break;
          }
        }
        // Quiet while the cold open still fills the screen.
        const on = !cold || cold.bottom < height * 0.5;
        setAt((s) => (s.index === index && s.on === on && s.act === act && Math.abs(s.local - local) < 0.01 ? s : { index, local, on, act }));
      }),
    [segments],
  );

  const current = segments[at.act];
  const next = beats[at.index + 1];
  return (
    <div className={styles.rail} data-on={at.on ? "" : undefined} aria-hidden="true">
      <div className={styles.railBar}>
        {segments.map((s) => {
          const fill = at.index >= s.end ? 1 : at.index < s.start ? 0 : (at.index - s.start + at.local) / (s.end - s.start);
          return (
            <span key={s.start} className={styles.railSeg} style={{ flex: `${s.end - s.start} 1 0` }}>
              <i style={{ "--f": fill.toFixed(3) } as CSSProperties} className={styles.railFill} />
            </span>
          );
        })}
      </div>
      <p className={styles.railNext}>
        {current?.act && (
          <span>
            Act {current.act.numeral}, {current.act.title}
          </span>
        )}
        {next && <span>Next: {next.title}</span>}
      </p>
    </div>
  );
}
