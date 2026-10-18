"use client";

import { useEffect, useState } from "react";

// What is covering the screen besides a beat's text: an act card
// (`<section data-act>`, between beats) when it covers the middle of the
// screen, or the cold open (`<section data-cold-open>`, at the very top)
// while it takes up a good part of the screen. Kept beside scroll.ts rather than
// in it, so the story date's rules stay as they were.

export type Cover = "none" | "act" | "cold";

// The part of the screen the cold open must fill before the stage gives way
// to its map; below this the globe is already coming back.
const COLD_SHARE = 0.4;

export function useCover(): Cover {
  const [cover, setCover] = useState<Cover>("none");

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const mid = innerHeight / 2;
      let next: Cover = "none";
      const cold = document.querySelector<HTMLElement>("[data-cold-open]")?.getBoundingClientRect();
      if (cold) {
        const seen = Math.min(cold.bottom, innerHeight) - Math.max(cold.top, 0);
        if (seen > innerHeight * COLD_SHARE) next = "cold";
      }
      if (next === "none") {
        for (const el of document.querySelectorAll<HTMLElement>("[data-act]")) {
          const box = el.getBoundingClientRect();
          if (box.top <= mid && box.bottom >= mid) {
            next = "act";
            break;
          }
        }
      }
      setCover(next);
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", queue);
      removeEventListener("resize", queue);
    };
  }, []);

  return cover;
}
