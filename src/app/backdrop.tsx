"use client";

import createGlobe, { type COBEOptions, type Globe } from "cobe";
import { useEffect, useRef } from "react";
import { TRONDHEIM } from "./iss";
import { type IssPosition, useIss } from "./iss-store";

// Full-page background: a dotted Earth rising from the bottom of the screen
// like a horizon seen from orbit. It turns slowly, leans toward the pointer,
// rises as you scroll, and marks Trondheim and the live ISS position.

const TURN_PER_SECOND = 0.035; // radians; one full turn in about three minutes
const deg = Math.PI / 180;

// Globe rotation that puts a place at the front of the globe.
const facing = (lat: number, lon: number) => ({
  phi: Math.PI - (lon * deg - Math.PI / 2),
  theta: lat * deg,
});

const START = facing(TRONDHEIM.lat, TRONDHEIM.lon);

const themes: Record<"light" | "dark", Partial<COBEOptions>> = {
  dark: {
    dark: 1,
    diffuse: 1.4,
    mapBrightness: 5,
    baseColor: [0.35, 0.35, 0.45],
    glowColor: [0.18, 0.2, 0.35],
    markerColor: [0.93, 0.35, 0.85],
    arcColor: [0.55, 0.45, 1],
  },
  light: {
    dark: 0,
    diffuse: 1.2,
    mapBrightness: 3,
    baseColor: [1, 1, 1],
    glowColor: [0.9, 0.9, 1],
    markerColor: [0.85, 0.2, 0.75],
    arcColor: [0.45, 0.35, 0.95],
  },
};

type Spring = { x: number; v: number };

// One step of a damped spring pulling `s` toward `target`.
function step(s: Spring, target: number, stiffness = 0.03, damping = 0.88) {
  s.v = (s.v + (target - s.x) * stiffness) * damping;
  s.x += s.v;
}

const scrollProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
};

function markersFor(iss: IssPosition | null): Pick<COBEOptions, "markers" | "arcs"> {
  const home: [number, number] = [TRONDHEIM.lat, TRONDHEIM.lon];
  if (!iss) return { markers: [{ location: home, size: 0.04 }], arcs: [] };
  const station: [number, number] = [iss.lat, iss.lon];
  return {
    markers: [
      { location: home, size: 0.04 },
      { location: station, size: 0.07 },
    ],
    arcs: [{ from: home, to: station }],
  };
}

export function Backdrop() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const globe = useRef<Globe | null>(null);
  const iss = useIss();
  const issRef = useRef(iss);

  // New ISS position: move the pink marker and the arc from Trondheim.
  useEffect(() => {
    issRef.current = iss;
    globe.current?.update(markersFor(iss));
  }, [iss]);

  useEffect(() => {
    const el = canvas.current;
    const box = wrap.current;
    if (!el || !box) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const theme = () => themes[darkQuery.matches ? "dark" : "light"];

    const pointer = { x: 0, y: 0 };
    const lean = { x: { x: 0, v: 0 }, y: { x: 0, v: 0 } };
    const rise: Spring = { x: scrollProgress(), v: 0 };
    let size = 0;
    let frame = 0;
    const startTime = performance.now();

    const build = () => {
      globe.current?.destroy();
      size = Math.round(Math.max(window.innerWidth, window.innerHeight) * 1.15);
      const dpr = Math.min(window.devicePixelRatio, size > 1400 ? 1.5 : 2);
      el.style.width = el.style.height = `${size}px`;
      globe.current = createGlobe(el, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi: START.phi,
        theta: 0.35,
        mapSamples: 20000,
        mapBrightness: 5,
        baseColor: [1, 1, 1],
        markerColor: [1, 1, 1],
        glowColor: [1, 1, 1],
        diffuse: 1,
        dark: 1,
        arcWidth: 0.6,
        arcHeight: 0.3,
        markerElevation: 0.02,
        ...theme(),
        ...markersFor(issRef.current),
      });
    };

    const place = () => {
      // The globe's top edge starts 40% down the screen (a horizon) and
      // rises to just above the top as you scroll to the bottom.
      const top = window.innerHeight * (0.4 - 0.5 * rise.x);
      box.style.transform = `translate3d(${(window.innerWidth - size) / 2}px, ${top}px, 0)`;
    };

    const render = (now: number) => {
      step(lean.x, pointer.x);
      step(lean.y, pointer.y);
      step(rise, scrollProgress(), 0.06, 0.8);
      place();
      globe.current?.update({
        phi: START.phi + ((now - startTime) / 1000) * TURN_PER_SECOND + lean.x.x * 0.4,
        theta: 0.35 + rise.x * 0.25 + lean.y.x * 0.15,
      });
      frame = requestAnimationFrame(render);
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    };
    const onScroll = () => {
      // Without motion, jump straight to the scrolled position.
      if (still) {
        rise.x = scrollProgress();
        place();
      }
    };
    const onResize = () => {
      build();
      place();
    };
    const onTheme = () => globe.current?.update(theme());

    build();
    place();
    if (!still) frame = requestAnimationFrame(render);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    darkQuery.addEventListener("change", onTheme);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      darkQuery.removeEventListener("change", onTheme);
      globe.current?.destroy();
    };
  }, []);

  return (
    <div aria-hidden className="backdrop">
      <div ref={wrap} className="globe-wrap">
        <canvas ref={canvas} className="globe" />
        <div className="globe-tint" />
      </div>
      <div className="grain" />
    </div>
  );
}
