"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeCatalogue, EPOCH, type SpaceObject } from "@/lib/space/catalogue";
import { countAt } from "@/lib/space/counts";
import type { Beat } from "./chapter1";
import { useStoryDate } from "./scroll";
import styles from "./space.module.css";

// What stays on screen behind the story: the globe (Task 4) and a quiet
// counter of the date and of how many objects are in orbit on it. Without
// JavaScript the story still reads in full; this part just isn't there.

const month = (day: number) =>
  new Date(EPOCH + Math.floor(day) * 86_400_000).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

export function Stage({ beats }: { beats: Beat[] }) {
  const { day } = useStoryDate(beats);
  const [objs, setObjs] = useState<SpaceObject[] | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/space/catalogue.bin")
      .then((r) => r.arrayBuffer())
      .then((buf) => live && setObjs(decodeCatalogue(buf)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const whole = Math.floor(day);
  const counts = useMemo(() => (objs ? countAt(objs, whole) : null), [objs, whole]);

  return (
    <div className={styles.stage} aria-hidden="true">
      <div className={styles.counter} data-ready={counts ? "" : undefined}>
        <span className={styles.when}>{month(day)}</span>
        <span className={styles.count}>{counts ? `${counts.total.toLocaleString("en-GB")} objects in orbit` : " "}</span>
      </div>
    </div>
  );
}
