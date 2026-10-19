"use client";

import { useEffect, useState } from "react";
import { subscribe } from "./scroll-store";

// What is covering the screen besides a beat's text: an act card
// (`<section data-act>`, between beats) when it covers the middle of the
// screen, or the cold open (`<section data-cold-open>`, at the very top)
// while it takes up a good part of the screen. Kept beside scroll.ts rather
// than in it, so the story date's rules stay as they were.

export type Cover = "none" | "act" | "cold";

// The part of the screen the cold open must fill before the stage gives way
// to its map; below this the globe is already coming back.
const COLD_SHARE = 0.4;

export function useCover(): { cover: Cover; hidden: boolean } {
  const [state, setState] = useState<{ cover: Cover; hidden: boolean }>({ cover: "none", hidden: false });

  useEffect(
    () =>
      subscribe(({ mid, height, acts, cold, opaque }) => {
        let cover: Cover = "none";
        if (cold && Math.min(cold.bottom, height) - Math.max(cold.top, 0) > height * COLD_SHARE) cover = "cold";
        else if (acts.some((a) => a.top <= mid && a.bottom >= mid)) cover = "act";
        // A photo, number or map across the middle of the screen hides the
        // globe as well as a fade does; nothing is drawn while it does.
        const hidden = cover === "cold" || opaque.some((o) => o.top <= mid && o.bottom >= mid);
        setState((s) => (s.cover === cover && s.hidden === hidden ? s : { cover, hidden }));
      }),
    [],
  );

  return state;
}
