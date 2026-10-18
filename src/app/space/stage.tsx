"use client";

import { useEffect, useMemo, useState } from "react";
import { dayOf, decodeCatalogue, EPOCH, type SpaceObject } from "@/lib/space/catalogue";
import { countAt } from "@/lib/space/counts";
import { GrowthChart } from "./chart";
import type { Beat } from "./chapter1";
import { useCover } from "./cover";
import { Globe } from "./globe";
import { useStoryDate } from "./scroll";
import { SHOTS, WITNESS, WITNESS_SHOT } from "./shots";
import styles from "./space.module.css";
import fade from "./stage.module.css";
import type { Shot } from "./types";

// Only what the stage needs from each beat; the text stays on the server.
export type Mark = Pick<Beat, "id" | "date" | "focus" | "highlight">;

// What stays on screen behind the story: the globe, and a quiet panel with
// the date, how many objects are in orbit on it, a chart of how that number
// grew, and the count of each kind (which is also the colour key). Without
// JavaScript the story still reads in full, counts included; this part just
// isn't there.

const WITNESS_IDS = [WITNESS];
const DEFAULT_SHOT: Shot = { kind: "orbit", view: "default" };

const month = (day: number) =>
  new Date(EPOCH + Math.floor(day) * 86_400_000).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const fmt = (n: number) => n.toLocaleString("en-GB");

export function Stage({ marks }: { marks: Mark[] }) {
  const { day, beat } = useStoryDate(marks);
  const cover = useCover();
  const now = marks[Math.max(0, beat)];
  // Before the first beat the globe looks down on the first beat's place; an
  // act card pulls it back to show Vanguard 1, the story's witness.
  const intro = useMemo<Shot>(() => ({ kind: "orbit", view: "default", focus: marks[0].focus }), [marks]);
  const shot = cover === "act" ? WITNESS_SHOT : beat < 0 ? intro : (SHOTS[now.id] ?? DEFAULT_SHOT);
  const highlight = cover === "act" ? WITNESS_IDS : beat < 0 ? undefined : now.highlight;
  const [objs, setObjs] = useState<SpaceObject[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/space/catalogue.bin")
      .then((r) => {
        if (!r.ok) throw new Error(`catalogue: HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then((buf) => live && setObjs(decodeCatalogue(buf)))
      .catch((err) => {
        console.error(err);
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const whole = Math.floor(day);
  const counts = useMemo(() => (objs ? countAt(objs, whole) : null), [objs, whole]);
  const span = useMemo(() => [dayOf(new Date(`${marks[0].date}T00:00:00Z`)), dayOf(new Date(`${marks[marks.length - 1].date}T00:00:00Z`))], [marks]);

  return (
    <div className={`${styles.stage} ${fade.fade} ${cover === "cold" ? fade.faded : ""}`} aria-hidden="true">
      <Globe objs={objs} day={day} shot={shot} highlight={highlight} spreadDay={beat < 0 ? undefined : dayOf(new Date(`${now.date}T00:00:00Z`))} paused={cover === "cold"} />
      {failed && <p className={styles.fallback}>The catalogue of objects didn&rsquo;t load, so the globe is empty. The story reads the same without it.</p>}
      <div className={styles.counter} data-ready={counts ? "" : undefined}>
        <p className={styles.when}>{beat < 0 ? "Before October 1957" : month(day)}</p>
        <p className={styles.total}>{counts ? `${fmt(counts.total)} ${counts.total === 1 ? "object" : "objects"} in orbit` : " "}</p>
        {objs && <GrowthChart objs={objs} day={day} from={span[0]} to={span[1]} />}
        {counts && (
          <ul className={styles.legend}>
            <li>
              <i className={styles.keySat} />
              Satellites <span>{fmt(counts.satellites)}</span>
            </li>
            <li>
              <i className={styles.keyRb} />
              Rocket stages <span>{fmt(counts.rocketBodies)}</span>
            </li>
            <li>
              <i className={styles.keyDeb} />
              Debris <span>{fmt(counts.debris)}</span>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
