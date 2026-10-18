"use client";

import { useEffect, useState } from "react";
import { dayOf } from "@/lib/space/catalogue";
import type { Beat } from "./chapter1";

// The story date, driven by the scroll. While a beat's text covers the
// middle of the screen the date holds at that beat's date; in the gap
// before the next beat it runs forward to the next one, so you watch the
// sky fill between moments. Before the first beat the sky is empty (the
// day before Sputnik). With reduced motion the date jumps from beat to
// beat instead of running.

const day = (iso: string) => dayOf(new Date(`${iso}T00:00:00Z`));

export function useStoryDate(beats: Beat[]): { day: number; beat: number } {
  const [state, setState] = useState(() => ({ day: day(beats[0].date) - 1, beat: -1 }));

  useEffect(() => {
    const days = beats.map((b) => day(b.date));
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const measure = () => {
      frame = 0;
      const mid = innerHeight / 2;
      const boxes = Array.from(document.querySelectorAll<HTMLElement>("[data-beat]"), (el) => el.getBoundingClientRect());
      let next = { day: days[0] - 1, beat: -1 };
      for (let k = 0; k < boxes.length && k < days.length; k++) {
        if (boxes[k].top > mid) break;
        if (boxes[k].bottom >= mid || k === boxes.length - 1) {
          next = { day: days[k], beat: k };
        } else {
          // In the gap between beat k and beat k + 1.
          const gap = boxes[k + 1].top - boxes[k].bottom;
          const t = reduce.matches || gap <= 0 ? 0 : Math.min(1, (mid - boxes[k].bottom) / gap);
          next = { day: days[k] + t * (days[k + 1] - days[k]), beat: k };
        }
      }
      setState((s) => (s.day === next.day && s.beat === next.beat ? s : next));
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    reduce.addEventListener("change", queue);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", queue);
      removeEventListener("resize", queue);
      reduce.removeEventListener("change", queue);
    };
  }, [beats]);

  return state;
}
