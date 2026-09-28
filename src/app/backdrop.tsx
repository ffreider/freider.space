"use client";

import createGlobe, { type COBEOptions, type Globe } from "cobe";
import { useEffect, useRef } from "react";
import type { Tle } from "@/lib/framsat-tle";
import { type SatPosition, TRONDHEIM, useFramsat } from "./framsat";

// Full-page background: a dotted Earth rising from the bottom of the screen
// like a horizon seen from orbit. It turns to keep FramSat-1 in view, so the
// Earth slides past underneath the satellite as it orbits. It also leans
// toward the pointer, rises as you scroll, and marks Trondheim.

const deg = Math.PI / 180;

// How far above the globe's centre (radians of tilt) the satellite is held.
// At the top of the page only the globe's upper part is on screen, so the
// satellite is held high; as the globe rises it can sit closer to the middle.
const liftAt = (rise: number) => 0.75 - 0.45 * rise;

// Globe rotation that puts a place at the front of the globe.
const facing = (lat: number, lon: number) => ({
  phi: Math.PI - (lon * deg - Math.PI / 2),
  theta: lat * deg,
});

const START = facing(TRONDHEIM.lat, TRONDHEIM.lon);

// The view (phi, theta) that keeps a satellite in sight, choosing the phi
// closest to `fromPhi` so the globe never spins the long way round.
function followView(sat: SatPosition, fromPhi: number, rise: number) {
  let { phi } = facing(sat.lat, sat.lon);
  while (phi - fromPhi > Math.PI) phi -= 2 * Math.PI;
  while (phi - fromPhi < -Math.PI) phi += 2 * Math.PI;
  return { phi, theta: sat.lat * deg - liftAt(rise) };
}

const colors: Partial<COBEOptions> = {
  dark: 1,
  diffuse: 1.6,
  mapBrightness: 9,
  mapBaseBrightness: 0.02,
  baseColor: [0.4, 0.4, 0.5],
  glowColor: [0.12, 0.13, 0.22],
  markerColor: [1, 0.9, 1],
  arcColor: [0.55, 0.45, 1],
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

function markersFor(sat: SatPosition | null): Pick<COBEOptions, "markers" | "arcs"> {
  const home: [number, number] = [TRONDHEIM.lat, TRONDHEIM.lon];
  const homeMarker = { location: home, size: 0.035, color: [0.75, 0.85, 1] as [number, number, number] };
  if (!sat) return { markers: [homeMarker], arcs: [] };
  const satellite: [number, number] = [sat.lat, sat.lon];
  return {
    markers: [
      homeMarker,
      { location: satellite, size: 0.09 },
    ],
    arcs: [{ from: home, to: satellite }],
  };
}

export function Backdrop({ tle }: { tle: Tle }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const globe = useRef<Globe | null>(null);
  const sat = useFramsat(tle);
  const satRef = useRef(sat);
  const stillRef = useRef(false);

  // New satellite position: move its marker and the arc from Trondheim.
  // Without motion, also jump the view straight to it.
  useEffect(() => {
    satRef.current = sat;
    globe.current?.update(markersFor(sat));
    if (sat && stillRef.current) {
      globe.current?.update(followView(sat, START.phi, scrollProgress()));
    }
  }, [sat]);

  useEffect(() => {
    const el = canvas.current;
    const box = wrap.current;
    if (!el || !box) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stillRef.current = still;

    const pointer = { x: 0, y: 0 };
    const lean = { x: { x: 0, v: 0 }, y: { x: 0, v: 0 } };
    const rise: Spring = { x: scrollProgress(), v: 0 };
    const view = {
      phi: { x: START.phi, v: 0 },
      theta: { x: TRONDHEIM.lat * deg - liftAt(rise.x), v: 0 },
    };
    let size = 0;
    let frame = 0;

    const build = () => {
      globe.current?.destroy();
      size = Math.round(Math.max(window.innerWidth, window.innerHeight) * 1.15);
      const dpr = Math.min(window.devicePixelRatio, size > 1400 ? 1.5 : 2);
      el.style.width = el.style.height = `${size}px`;
      globe.current = createGlobe(el, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi: view.phi.x,
        theta: view.theta.x,
        mapSamples: 200000,
        mapBrightness: 5,
        baseColor: [1, 1, 1],
        markerColor: [1, 1, 1],
        glowColor: [1, 1, 1],
        diffuse: 1,
        dark: 1,
        arcWidth: 0.6,
        arcHeight: 0.3,
        markerElevation: 0.02,
        ...colors,
        ...markersFor(satRef.current),
      });
    };

    const place = () => {
      // The globe's top edge starts 40% down the screen (a horizon) and
      // rises to just above the top as you scroll to the bottom.
      const top = window.innerHeight * (0.4 - 0.5 * rise.x);
      box.style.transform = `translate3d(${(window.innerWidth - size) / 2}px, ${top}px, 0)`;
    };

    const render = () => {
      step(lean.x, pointer.x);
      step(lean.y, pointer.y);
      step(rise, scrollProgress(), 0.06, 0.8);
      if (satRef.current) {
        const target = followView(satRef.current, view.phi.x, rise.x);
        step(view.phi, target.phi, 0.02, 0.85);
        step(view.theta, target.theta, 0.02, 0.85);
      }
      place();
      globe.current?.update({
        phi: view.phi.x + lean.x.x * 0.3,
        theta: view.theta.x + lean.y.x * 0.1,
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

    build();
    place();
    if (!still) frame = requestAnimationFrame(render);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      globe.current?.destroy();
    };
  }, []);

  return (
    <div aria-hidden className="backdrop">
      <div ref={wrap} className="globe-wrap">
        <canvas ref={canvas} className="globe" />
        <div className="globe-tint" />
      </div>
      <div className="scrim" />
      <div className="grain" />
    </div>
  );
}
