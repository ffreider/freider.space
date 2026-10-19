"use client";

import { useEffect, useState } from "react";
import { dayOf } from "@/lib/space/catalogue";
import { request, subscribe } from "./scroll-store";

// The story date, driven by the scroll. While a beat's section covers the
// middle of the screen the date holds at that beat's date; in the gap
// before the next beat it runs forward to the next one, so you watch the
// sky fill between moments. Before the first beat the sky is empty (the
// day before Sputnik). With reduced motion the date jumps from beat to
// beat instead of running.
//
// `shotBeat` is a separate count, for the camera: the beat whose text block
// has reached the middle of the screen. A beat can open with a photo or a
// number that hides the globe, and the globe should move for the reader's
// eyes, so its shot changes when the text arrives, not the section.

const day = (iso: string) => dayOf(new Date(`${iso}T00:00:00Z`));

export function useStoryDate(beats: { date: string }[]): { day: number; beat: number; shotBeat: number } {
  const [state, setState] = useState(() => ({ day: day(beats[0].date) - 1, beat: -1, shotBeat: -1 }));

  useEffect(() => {
    const days = beats.map((b) => day(b.date));
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");

    const off = subscribe(({ mid, beats: boxes, texts }) => {
      let next = { day: days[0] - 1, beat: -1, shotBeat: -1 };
      for (let k = 0; k < boxes.length && k < days.length; k++) {
        if (boxes[k].top > mid) break;
        const shotBeat = texts[k] && texts[k].top <= mid ? k : k - 1;
        if (boxes[k].bottom >= mid || k === boxes.length - 1) {
          next = { day: days[k], beat: k, shotBeat };
        } else {
          // In the gap between beat k and beat k + 1.
          const gap = boxes[k + 1].top - boxes[k].bottom;
          const t = reduce.matches || gap <= 0 ? 0 : Math.min(1, (mid - boxes[k].bottom) / gap);
          next = { day: days[k] + t * (days[k + 1] - days[k]), beat: k, shotBeat: k };
        }
      }
      setState((s) => (s.day === next.day && s.beat === next.beat && s.shotBeat === next.shotBeat ? s : next));
    });
    reduce.addEventListener("change", request);
    return () => {
      off();
      reduce.removeEventListener("change", request);
    };
  }, [beats]);

  return state;
}
