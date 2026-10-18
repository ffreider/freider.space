"use client";

import { useEffect, useRef, type ReactNode } from "react";

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
    let frame = 0;

    const apply = (p: number) => {
      el.style.setProperty("--p", p.toFixed(4));
      for (const svg of el.querySelectorAll<SVGSVGElement>("svg")) {
        const track = svg.querySelector<SVGPathElement>("[data-track]");
        const dot = svg.querySelector<SVGElement>("[data-dot]");
        if (track && dot) {
          const u = dot.dataset.mode === "updown" ? 1 - Math.abs(2 * p - 1) : p;
          const at = track.getPointAtLength(u * track.getTotalLength());
          dot.setAttribute("cx", String(at.x));
          dot.setAttribute("cy", String(at.y));
          const sight = svg.querySelector<SVGLineElement>("[data-sight]");
          sight?.setAttribute("x2", String(at.x));
          sight?.setAttribute("y2", String(at.y));
        }
        for (const out of svg.querySelectorAll<SVGTextElement>("[data-readout]")) {
          const seconds = Math.round(p * Number(out.dataset.max) * 60);
          out.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
        }
      }
    };

    const measure = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const travel = box.height - innerHeight;
      apply(travel <= 0 ? 1 : clamp(-box.top / travel));
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

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
