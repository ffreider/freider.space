"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { subscribe, type Frame } from "./scroll-store";

// Drives a tall block from the scroll. The block is as tall as the reader's
// scroll through it; its content sticks to the screen, and --p (0 at the
// moment the block reaches the top, 1 when it leaves) tells the CSS how far
// along it is. Things that CSS can't do are done here with attributes:
//   [data-track]   a path; [data-dot] sits on it at p (data-mode="updown"
//                  goes out and comes back), [data-sight] is a line that
//                  follows the dot from its own x1,y1
//   [data-readout] text counting up to data-max minutes, as m:ss
// Without JavaScript --p stays 1, so every map shows its finished state and
// the readouts show their final text.

const clamp = (v: number) => Math.max(0, Math.min(1, v));

export function ScrollProgress({ className, children }: { className?: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const svgs = Array.from(el.querySelectorAll<SVGSVGElement>("svg"));
    const lengths = new Map<SVGPathElement, number>();
    let shown = ""; // which SVGs were drawn last time, so a rotation redraws
    let at = NaN;

    const apply = (p: number, drawn: boolean[]) => {
      const key = drawn.join();
      if (p === at && key === shown) return;
      at = p;
      shown = key;
      el.style.setProperty("--p", p.toFixed(4));
      svgs.forEach((svg, k) => {
        if (!drawn[k]) return;
        const track = svg.querySelector<SVGPathElement>("[data-track]");
        const dot = svg.querySelector<SVGElement>("[data-dot]");
        if (track && dot) {
          let length = lengths.get(track);
          if (length === undefined) lengths.set(track, (length = track.getTotalLength()));
          const u = dot.dataset.mode === "updown" ? 1 - Math.abs(2 * p - 1) : p;
          const pt = track.getPointAtLength(u * length);
          dot.setAttribute("cx", String(pt.x));
          dot.setAttribute("cy", String(pt.y));
          const sight = svg.querySelector<SVGLineElement>("[data-sight]");
          sight?.setAttribute("x2", String(pt.x));
          sight?.setAttribute("y2", String(pt.y));
        }
        for (const out of svg.querySelectorAll<SVGTextElement>("[data-readout]")) {
          const seconds = Math.round(p * Number(out.dataset.max) * 60);
          out.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
        }
      });
    };

    // Read from the shared measurement: the block, and which of its SVGs
    // are drawn at all (the variant for the other orientation is display:none
    // and has no size).
    const follow = ({ rects }: Frame) => {
      const box = rects.get(el);
      if (!box) return;
      const travel = box.height - innerHeight;
      const p = travel <= 0 ? 1 : Math.round(clamp(-box.top / travel) * 10_000) / 10_000;
      apply(
        p,
        svgs.map((svg) => (rects.get(svg)?.height ?? 0) > 0),
      );
    };

    // Only while the block is on or near the screen. When it leaves, once
    // more, so a map the reader jumped past rests at its start or its end.
    let off: (() => void) | null = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) off ??= subscribe(follow, [el, ...svgs]);
        else {
          off?.();
          off = null;
          const sub = subscribe(follow, [el, ...svgs]);
          sub();
        }
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      off?.();
    };
  }, []);

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
