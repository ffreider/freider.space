import type { ReactNode } from "react";
import styles from "./space.module.css";
import type { Act } from "./types";

// A full-screen title between two beats. Not a beat itself (no data-beat),
// so the story date keeps running through it. The globe stays visible
// behind it; a soft scrim keeps the text readable.

export function ActCard({ act, number, numberLabel, witness }: { act: Act; number: string; numberLabel: string; witness: ReactNode }) {
  return (
    <section className={`${styles.bleed} ${styles.act}`} data-act={act.id} aria-labelledby={`act-${act.id}`}>
      <div className={styles.actInner}>
        <h2 id={`act-${act.id}`}>
          <span className={styles.actNumeral} aria-hidden="true">
            {act.numeral}
          </span>
          <span className={styles.sr}>Act {act.numeral}: </span>
          <span className={styles.actTitle}>{act.title}</span>
        </h2>
        <p className={styles.actYears}>{act.years}</p>
        <p className={styles.actNumber}>
          <strong>{number}</strong> <span>{numberLabel}</span>
        </p>
        <p className={styles.actWitness}>{witness}</p>
      </div>
    </section>
  );
}
