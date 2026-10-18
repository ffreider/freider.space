import type { ReactNode } from "react";
import { ColdOpenMap } from "./story-map";
import styles from "./space.module.css";

// The first thing on the page, before the title: a morning in 1995 over a
// dark map of the north. The globe is faded out while this is on screen.

export function ColdOpenSection({ kicker, paragraphs, turn }: { kicker: string; paragraphs: ReactNode[]; turn: ReactNode }) {
  return (
    <section className={styles.coldOpen} data-cold-open>
      <div className={styles.coldMap} aria-hidden="true">
        <ColdOpenMap />
      </div>
      <div className={styles.coldText}>
        <p className={styles.coldKicker}>{kicker}</p>
        {paragraphs.map((p, k) => (
          <p key={k}>{p}</p>
        ))}
        <p className={styles.coldTurn}>{turn}</p>
      </div>
    </section>
  );
}
