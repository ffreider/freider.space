"use client";

import { useEffect, useRef } from "react";

// How strongly each layer reacts: px of movement per unit of mouse offset
// (mouse is normalized to -0.5..0.5), and px of travel from the top of the
// page to the bottom, so the colors never scroll fully off-screen.
const layers = [
  { className: "blob blob-teal", mouse: 90, scroll: -300 },
  { className: "blob blob-blue", mouse: -60, scroll: 200 },
  { className: "blob blob-magenta", mouse: 130, scroll: -450 },
];

const scrollProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
};

export function Backdrop() {
  const wraps = useRef<(HTMLDivElement | null)[]>([]);
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = { x: 0, y: 0, px: -9999, py: -9999, scroll: scrollProgress() };
    const current = { ...target };
    let frame = 0;

    const render = () => {
      // Ease toward the target so movement feels floaty rather than glued on.
      let moving = false;
      for (const key of Object.keys(target) as (keyof typeof target)[]) {
        const delta = target[key] - current[key];
        current[key] += delta * 0.06;
        if (Math.abs(delta) > 0.0005) moving = true;
      }

      layers.forEach((layer, i) => {
        const el = wraps.current[i];
        if (!el) return;
        const x = current.x * layer.mouse;
        const y = current.y * layer.mouse + current.scroll * layer.scroll;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });

      if (glow.current) {
        glow.current.style.transform = `translate3d(${current.px}px, ${current.py}px, 0) translate(-50%, -50%)`;
      }

      frame = moving ? requestAnimationFrame(render) : 0;
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const onPointer = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth - 0.5;
      target.y = e.clientY / window.innerHeight - 0.5;
      target.px = e.clientX;
      target.py = e.clientY;
      if (current.px === -9999) {
        // Start the glow where the pointer first appears, not off-screen.
        current.px = e.clientX;
        current.py = e.clientY;
      }
      glow.current?.classList.add("is-active");
      wake();
    };

    const onScroll = () => {
      target.scroll = scrollProgress();
      wake();
    };

    const onLeave = () => glow.current?.classList.remove("is-active");

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    wake();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden className="backdrop">
      {layers.map((layer, i) => (
        <div
          key={layer.className}
          ref={(el) => {
            wraps.current[i] = el;
          }}
          className="blob-wrap"
        >
          <div className={layer.className} />
        </div>
      ))}
      <div ref={glow} className="cursor-glow" />
      <div className="grain" />
    </div>
  );
}
