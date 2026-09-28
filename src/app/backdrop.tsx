"use client";

import { useEffect, useRef } from "react";

// Large background color fields. `mouse` is px of movement per unit of mouse
// offset (mouse is normalized to -0.5..0.5); `scroll` is px of travel from the
// top of the page to the bottom, so the colors never scroll fully off-screen.
const fields = [
  { className: "blob blob-teal", mouse: 110, scroll: -300 },
  { className: "blob blob-blue", mouse: -80, scroll: 200 },
  { className: "blob blob-magenta", mouse: 150, scroll: -450 },
  { className: "blob blob-violet", mouse: -130, scroll: 350 },
  { className: "blob blob-amber", mouse: 70, scroll: -200 },
];

// Two soft, shape-shifting color forms that drift lazily after the pointer,
// the second following the first. They swell a little while moving.
const trail = [
  { className: "orb orb-1", stiffness: 0.02, damping: 0.9 },
  { className: "orb orb-2", stiffness: 0.012, damping: 0.92 },
];

const scrollProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
};

type Body = { x: number; y: number; vx: number; vy: number };

// One step of a damped spring pulling `b` toward (tx, ty).
function step(b: Body, tx: number, ty: number, stiffness: number, damping: number) {
  b.vx = (b.vx + (tx - b.x) * stiffness) * damping;
  b.vy = (b.vy + (ty - b.y) * stiffness) * damping;
  b.x += b.vx;
  b.y += b.vy;
  return Math.abs(b.vx) + Math.abs(b.vy) + Math.abs(tx - b.x) + Math.abs(ty - b.y) > 0.05;
}

export function Backdrop() {
  const fieldEls = useRef<(HTMLDivElement | null)[]>([]);
  const trailEls = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pointer = { x: 0, y: 0, nx: 0, ny: 0, seen: false };
    let scroll = scrollProgress();
    let scrollNow = scroll;
    const fieldBodies: Body[] = fields.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }));
    const trailBodies: Body[] = trail.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }));
    let frame = 0;

    const render = () => {
      let moving = false;

      scrollNow += (scroll - scrollNow) * 0.08;
      if (Math.abs(scroll - scrollNow) > 0.0005) moving = true;

      // Background fields: soft springs with a little overshoot.
      fields.forEach((field, i) => {
        const b = fieldBodies[i];
        if (step(b, pointer.nx * field.mouse, pointer.ny * field.mouse, 0.02, 0.9)) moving = true;
        const el = fieldEls.current[i];
        if (el) {
          el.style.transform = `translate3d(${b.x}px, ${b.y + scrollNow * field.scroll}px, 0)`;
        }
      });

      // Pointer forms: the first follows the pointer, the second follows the
      // first, so they wander apart while moving and reunite when still.
      if (pointer.seen) {
        trail.forEach((t, i) => {
          const b = trailBodies[i];
          const lead = i === 0 ? pointer : trailBodies[i - 1];
          if (step(b, lead.x, lead.y, t.stiffness, t.damping)) moving = true;
          const swell = 1 + Math.min(Math.hypot(b.vx, b.vy) / 60, 0.3);
          const el = trailEls.current[i];
          if (el) {
            el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) translate(-50%, -50%) scale(${swell})`;
          }
        });
      }

      frame = moving ? requestAnimationFrame(render) : 0;
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.nx = e.clientX / window.innerWidth - 0.5;
      pointer.ny = e.clientY / window.innerHeight - 0.5;
      if (!pointer.seen) {
        // Start the trail where the pointer first appears, not in a corner.
        pointer.seen = true;
        for (const b of trailBodies) {
          b.x = e.clientX;
          b.y = e.clientY;
        }
      }
      trailEls.current.forEach((el) => el?.classList.add("is-active"));
      wake();
    };

    const onScroll = () => {
      scroll = scrollProgress();
      wake();
    };

    const onLeave = () =>
      trailEls.current.forEach((el) => el?.classList.remove("is-active"));

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    wake();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden className="backdrop">
      {fields.map((field, i) => (
        <div
          key={field.className}
          ref={(el) => {
            fieldEls.current[i] = el;
          }}
          className="blob-wrap"
        >
          <div className={field.className} />
        </div>
      ))}
      {trail.map((t, i) => (
        <div
          key={t.className}
          ref={(el) => {
            trailEls.current[i] = el;
          }}
          className={t.className}
        >
          <div className="orb-shape" />
        </div>
      ))}
      <div className="grain" />
    </div>
  );
}
