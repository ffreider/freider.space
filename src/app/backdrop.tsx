"use client";

import {
  geoDistance,
  geoGraticule10,
  geoInterpolate,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import { useEffect, useRef } from "react";
import { feature, mesh } from "topojson-client";
import type { Tle } from "@/lib/framsat-tle";
import { type SatState, TRONDHEIM, useFramsat } from "./framsat";

// Full-page background: a dotted Earth that follows FramSat-1. At the top of
// the page it's a horizon rising from the bottom of the screen; as you scroll
// it grows into the whole planet, centred, by the FramSat-1 section at the
// bottom. Land is a halftone of dots in the aurora colours, with coastlines
// and faint country borders so the geography stays readable. The satellite
// gets a crisp label, and the Earth slides past underneath it as it orbits.

// How far (degrees) the centre of the view sits south of and west of the
// satellite. As a horizon only the globe's upper part is on screen, so the
// satellite is held high in the middle; on the whole globe at the bottom of
// the page it moves to the upper right, clear of the FramSat-1 cards.
const liftAt = (open: number) => 42 * (1 - open) + 40 * open;
const shiftAt = (open: number) => 30 * open;

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

// Eases 0..1 so the globe stays a horizon for a while, then opens up.
const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

// Shortest signed difference between two longitudes, in degrees.
const lonDelta = (from: number, to: number) => ((to - from + 540) % 360) - 180;

// A small tile with one dot, repeated to fill land as a halftone.
function dotPattern(ctx: CanvasRenderingContext2D, dpr: number) {
  const cell = Math.round(5 * dpr);
  const tile = document.createElement("canvas");
  tile.width = tile.height = cell;
  const t = tile.getContext("2d")!;
  t.fillStyle = "#fff";
  t.beginPath();
  t.arc(cell / 2, cell / 2, 1.1 * dpr, 0, Math.PI * 2);
  t.fill();
  return ctx.createPattern(tile, "repeat")!;
}

type World = { land: GeoPermissibleObjects; borders: GeoPermissibleObjects };

export function Backdrop({ tle }: { tle: Tle }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const sat = useFramsat(tle);
  const satRef = useRef<SatState | null>(sat);

  useEffect(() => {
    satRef.current = sat;
  }, [sat]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0 };
    const lean = { x: { x: 0, v: 0 }, y: { x: 0, v: 0 } };
    const rise: Spring = { x: scrollProgress(), v: 0 };
    // The point at the centre of the view, as longitude / latitude.
    const view = {
      lon: { x: TRONDHEIM.lon - shiftAt(smooth(rise.x)), v: 0 },
      lat: { x: TRONDHEIM.lat - liftAt(smooth(rise.x)), v: 0 },
    };
    const graticule = geoGraticule10();
    const projection = geoOrthographic().clipAngle(90).precision(0.5);
    const path = geoPath(projection, ctx);
    let world: World | null = null;
    let dots: CanvasPattern | null = null;
    let dpr = 1;
    let frame = 0;
    let cancelled = false;

    // The world map (110 KB) loads separately so it doesn't hold up the page.
    import("world-atlas/countries-110m.json").then((mod) => {
      if (cancelled) return;
      const topo = mod.default as unknown as Parameters<typeof feature>[0] & {
        objects: Record<"land" | "countries", Parameters<typeof feature>[1]>;
      };
      world = {
        land: feature(topo, topo.objects.land),
        borders: mesh(topo, topo.objects.countries as never, (a, b) => a !== b),
      };
      if (still) draw();
    });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio, 2);
      el.width = Math.round(window.innerWidth * dpr);
      el.height = Math.round(window.innerHeight * dpr);
      dots = dotPattern(ctx, dpr);
    };

    const draw = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const open = smooth(rise.x);

      // Horizon: a big globe whose top edge sits 45% down the screen.
      // Whole Earth: the globe spans 85% of the screen, centred.
      const horizonR = 0.46 * Math.max(vw, vh);
      const fullR = 0.425 * Math.min(vw, vh);
      const r = horizonR + (fullR - horizonR) * open;
      const horizonY = 0.45 * vh + horizonR;
      const cy = horizonY + (vh / 2 - horizonY) * open;
      const cx = vw / 2;

      projection
        .scale(r * dpr)
        .translate([cx * dpr, cy * dpr])
        .rotate([-(view.lon.x + lean.x.x * 18), -(view.lat.x + lean.y.x * 6)]);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, el.width, el.height);
      const X = cx * dpr;
      const Y = cy * dpr;
      const R = r * dpr;

      // 1. Everything that gets the aurora colours: grid, land, borders.
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = dpr;
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      path(graticule);
      ctx.stroke();
      if (world && dots) {
        ctx.fillStyle = dots;
        ctx.beginPath();
        path(world.land);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.beginPath();
        path(world.land);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.beginPath();
        path(world.borders);
        ctx.stroke();
      }

      // 2. Tint what's drawn so far, green in the west to pink in the east.
      ctx.globalCompositeOperation = "source-atop";
      const tint = ctx.createLinearGradient(X - R, Y - R, X + R, Y + R * 0.4);
      tint.addColorStop(0, "#34d399");
      tint.addColorStop(0.3, "#22d3ee");
      tint.addColorStop(0.55, "#818cf8");
      tint.addColorStop(0.78, "#c084fc");
      tint.addColorStop(1, "#f472b6");
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, el.width, el.height);

      // 3. Ocean and atmosphere underneath.
      ctx.globalCompositeOperation = "destination-over";
      const ocean = ctx.createRadialGradient(X - R * 0.3, Y - R * 0.4, 0, X, Y, R);
      ocean.addColorStop(0, "rgba(40, 52, 90, 0.55)");
      ocean.addColorStop(1, "rgba(10, 12, 28, 0.75)");
      ctx.fillStyle = ocean;
      ctx.beginPath();
      ctx.arc(X, Y, R, 0, Math.PI * 2);
      ctx.fill();
      const glow = ctx.createRadialGradient(X, Y, R * 0.96, X, Y, R * 1.12);
      glow.addColorStop(0, "rgba(99, 102, 241, 0.35)");
      glow.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(X, Y, R * 1.12, 0, Math.PI * 2);
      ctx.fill();

      // 4. Trondheim, the satellite, and the path between them on top.
      ctx.globalCompositeOperation = "source-over";
      const home: [number, number] = [TRONDHEIM.lon, TRONDHEIM.lat];
      const s = satRef.current;
      if (s) {
        const there: [number, number] = [s.lon, s.lat];
        const between = geoInterpolate(home, there);
        ctx.strokeStyle = "rgba(196, 181, 253, 0.8)";
        ctx.lineWidth = 1.5 * dpr;
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.beginPath();
        path({
          type: "LineString",
          coordinates: Array.from({ length: 33 }, (_, i) => between(i / 32)),
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const centre = projection.invert!([X, Y])!;
      if (geoDistance(home, centre) < Math.PI / 2) {
        const [hx, hy] = projection(home)!;
        ctx.fillStyle = "#dbeafe";
        ctx.beginPath();
        ctx.arc(hx, hy, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // The satellite's label is HTML, so it stays sharp above the blur.
      if (label.current) {
        const visible = s && geoDistance([s.lon, s.lat], centre) < Math.PI / 2;
        label.current.style.opacity = visible ? "1" : "0";
        if (s && visible) {
          const [px, py] = projection([s.lon, s.lat])!;
          label.current.style.transform = `translate3d(${px / dpr}px, ${py / dpr}px, 0)`;
        }
      }

      // The blur behind the text fades away as the whole Earth comes into view.
      if (scrim.current) {
        scrim.current.style.opacity = String(1 - smooth((rise.x - 0.75) / 0.25));
      }
    };

    const follow = () => {
      const s = satRef.current;
      if (!s) return;
      const open = smooth(rise.x);
      const lon = s.lon - shiftAt(open);
      step(view.lon, view.lon.x + lonDelta(view.lon.x, lon), 0.02, 0.85);
      step(view.lat, s.lat - liftAt(open), 0.02, 0.85);
    };

    const render = () => {
      step(lean.x, pointer.x);
      step(lean.y, pointer.y);
      step(rise, scrollProgress(), 0.06, 0.8);
      follow();
      draw();
      frame = requestAnimationFrame(render);
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    };
    const onResize = () => {
      resize();
      draw();
    };

    resize();
    draw();

    if (still) {
      // Without motion: jump straight to the satellite and the scrolled
      // layout, and redraw once a second as the satellite moves.
      const jump = () => {
        rise.x = scrollProgress();
        const s = satRef.current;
        if (s) {
          view.lon.x = s.lon - shiftAt(smooth(rise.x));
          view.lat.x = s.lat - liftAt(smooth(rise.x));
        }
        draw();
      };
      const timer = setInterval(jump, 1000);
      window.addEventListener("scroll", jump, { passive: true });
      window.addEventListener("resize", onResize);
      return () => {
        cancelled = true;
        clearInterval(timer);
        window.removeEventListener("scroll", jump);
        window.removeEventListener("resize", onResize);
      };
    }

    frame = requestAnimationFrame(render);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div aria-hidden className="backdrop">
      <canvas ref={canvas} className="globe" />
      <div ref={scrim} className="scrim" />
      <div className="grain" />
      <div ref={label} className="sat-label">
        <span className="sat-dot" />
        <span className="sat-name">FramSat-1</span>
      </div>
    </div>
  );
}
