"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";
import styles from "./space.module.css";
import type { Credit, Picture } from "./types";

// Before and after, one on top of the other with a handle between. The
// handle is a real range input stretched over the pictures, so it works with
// arrow keys, Home and End as well as by dragging. Before the page's
// JavaScript has run, and for readers without it, the two pictures sit side
// by side with their labels instead.

type Side = Picture & { label: string };

const noop = () => () => {};

export function Compare({ before, after, caption, credit }: { before: Side; after: Side; caption: string; credit: Credit }) {
  const [pos, setPos] = useState(50);
  const live = useSyncExternalStore(noop, () => true, () => false);
  const side = (s: Side, className: string) => (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.src} alt={s.alt} width={s.width} height={s.height} loading="lazy" decoding="async" />
      <span className={styles.compareLabel}>{s.label}</span>
    </div>
  );
  return (
    <figure className={styles.compare} data-live={live ? "" : undefined} style={{ "--pos": `${pos}%`, "--ratio": `${before.width} / ${before.height}` } as CSSProperties}>
      <div className={styles.compareStage}>
        {side(before, styles.compareBefore)}
        {side(after, styles.compareAfter)}
        {live && (
          <>
            <span className={styles.compareHandle} aria-hidden="true" />
            <input
              type="range"
              min={0}
              max={100}
              step={2}
              value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              className={styles.compareRange}
              aria-label={`Compare ${before.label} with ${after.label}`}
              aria-valuetext={`${pos}% of the way from ${before.label} to ${after.label}`}
            />
          </>
        )}
      </div>
      <figcaption className={styles.mediaNote}>
        <span>{caption}</span>
        <small>
          <a href={credit.url} target="_blank" rel="noopener">
            {credit.text}
          </a>
        </small>
      </figcaption>
    </figure>
  );
}
