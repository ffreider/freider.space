"use client";

import {
  geoCircle,
  geoDistance,
  geoGraticule10,
  geoInterpolate,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import { useEffect, useMemo, useRef } from "react";
import { twoline2satrec } from "satellite.js";
import { feature, mesh } from "topojson-client";
import type { Tle } from "@/lib/framsat-tle";
import { type SatState, TRONDHEIM, useFramsat } from "./framsat";
import type { Reception } from "@/lib/satnogs";
import { groundTrack, subsolarPoint } from "./framsat-orbit";

// Full-page background: an Earth that follows FramSat-1. Through most of
// the page it's a horizon rising from the bottom of the screen; when the
// FramSat-1 section (#framsat) scrolls in, it opens into the whole planet
// beside the stats, and you can drag it to spin it. Land is a flat fill with
// coastlines and faint country borders.
//
// It only redraws while something is changing (scrolling, easing toward the
// satellite, dragging), so an idle page costs almost nothing.

// How far south of the satellite (degrees) the view is centred. As a horizon
// only the globe's upper part is on screen, so the satellite is held high;
// on the whole globe it sits in the middle.
const liftAt = (open: number) => 42 * (1 - open);

// After a drag, how long the globe stays where you left it before easing
// back to the satellite.
const HOLD_MS = 4000;

// Width reserved for the stats panel beside the globe on wide screens.
const PANEL_SPACE = 500;

type Spring = { x: number; v: number };

// One step of a damped spring pulling `s` toward `target`. Once it's within
// `rest` of the target and nearly stopped, it snaps there and reports that
// it's done, so tiny moves (like the satellite's once-a-second drift) don't
// keep the page animating.
function step(s: Spring, target: number, stiffness: number, damping: number, rest: number) {
  if (Math.abs(target - s.x) < rest && Math.abs(s.v) < rest * 0.1) {
    s.x = target;
    s.v = 0;
    return false;
  }
  s.v = (s.v + (target - s.x) * stiffness) * damping;
  s.x += s.v;
  return true;
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

const scrollProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
};

// Shortest signed difference between two longitudes, in degrees.
const lonDelta = (from: number, to: number) => ((to - from + 540) % 360) - 180;

type World = { land: GeoPermissibleObjects; borders: GeoPermissibleObjects };

// The globe's colours, from the --globe-* tokens in globals.css.
type Palette = {
  grid: string;
  land: string;
  coast: string;
  border: string;
  ocean1: string;
  ocean2: string;
  night: string;
  track: string;
  route: string;
  home: string;
  station: string;
};

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(`--globe-${name}`).trim();
  return {
    grid: v("grid"),
    land: v("land"),
    coast: v("coast"),
    border: v("border"),
    ocean1: v("ocean-1"),
    ocean2: v("ocean-2"),
    night: v("night"),
    track: v("track"),
    route: v("route"),
    home: v("home"),
    station: v("station"),
  };
}

export function Backdrop({ tle, stations }: { tle: Tle; stations: Reception[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const satrec = useMemo(() => twoline2satrec(tle.line1, tle.line2), [tle]);
  const sat = useFramsat(tle);
  const satRef = useRef<SatState | null>(sat);
  const trackRef = useRef<ReturnType<typeof groundTrack> | null>(null);
  const wakeRef = useRef<() => void>(() => {});
  const stationsRef = useRef(stations);

  // The satellite moved (once a second, or faster when time-travelling):
  // update its ground track and ease the view after it.
  useEffect(() => {
    satRef.current = sat;
    trackRef.current = sat ? groundTrack(satrec, new Date(sat.time)) : null;
    wakeRef.current();
  }, [sat, satrec]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0 };
    const lean = { x: { x: 0, v: 0 }, y: { x: 0, v: 0 } };
    // The point at the centre of the view, as longitude / latitude.
    const view = {
      lon: { x: TRONDHEIM.lon, v: 0 },
      lat: { x: TRONDHEIM.lat - liftAt(0), v: 0 },
    };
    const drag = { active: false, x: 0, y: 0, until: 0 };
    const globe = { cx: 0, cy: 0, r: 0, open: 0 };
    const graticule = geoGraticule10();
    const projection = geoOrthographic().clipAngle(90).precision(0.7);
    const path = geoPath(projection, ctx);
    let world: World | null = null;
    const palette = readPalette();
    let dpr = 1;
    let frame = 0;
    let cancelled = false;
    let placed = false;

    const stage = () => document.getElementById("framsat");

    // Where the globe goes and how big it is, for the current scroll position.
    const layout = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = stage()?.getBoundingClientRect();
      // 0 while the FramSat-1 section is below the screen, 1 once it fills it.
      const open = rect ? smooth(1 - rect.top / vh) : 0;

      // Horizon: a big globe whose top edge rises from 45% to 32% of the
      // screen height over the page.
      const horizonR = 0.46 * Math.max(vw, vh);
      const horizonY = (0.45 - 0.13 * smooth(scrollProgress())) * vh + horizonR;

      // Whole Earth, moving with the section: left of the stats panel on
      // wide screens, above it on narrow ones.
      const wide = vw >= 1024;
      const top = rect?.top ?? vh;
      const fullR = wide
        ? Math.min(0.42 * vh, 0.44 * (vw - PANEL_SPACE))
        : 0.44 * Math.min(vw, vh);
      const fullX = wide ? (vw - PANEL_SPACE) / 2 + 16 : vw / 2;
      // On wide screens it stays centred once the section fills the screen,
      // even while you scroll through the panel.
      const fullY = wide ? Math.max(top, 0) + vh / 2 : top + fullR + 72;

      globe.open = open;
      globe.r = horizonR + (fullR - horizonR) * open;
      globe.cx = vw / 2 + (fullX - vw / 2) * open;
      globe.cy = horizonY + (fullY - horizonY) * open;
    };

    const draw = () => {
      const { cx, cy, r, open } = globe;
      projection
        .scale(r * dpr)
        .translate([cx * dpr, cy * dpr])
        .rotate([-(view.lon.x + lean.x.x * 18), -(view.lat.x + lean.y.x * 6)]);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, el.width, el.height);
      const X = cx * dpr;
      const Y = cy * dpr;
      const R = r * dpr;

      // 1. Grid, land (a flat fill with coastlines) and country borders.
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = dpr;
      ctx.strokeStyle = palette.grid;
      ctx.beginPath();
      path(graticule);
      ctx.stroke();
      if (world) {
        ctx.beginPath();
        path(world.land);
        ctx.fillStyle = palette.land;
        ctx.fill();
        ctx.strokeStyle = palette.coast;
        ctx.stroke();
        ctx.strokeStyle = palette.border;
        ctx.beginPath();
        path(world.borders);
        ctx.stroke();
      }

      // 3. Ocean and atmosphere underneath.
      ctx.globalCompositeOperation = "destination-over";
      const ocean = ctx.createRadialGradient(X - R * 0.3, Y - R * 0.4, 0, X, Y, R);
      ocean.addColorStop(0, palette.ocean1);
      ocean.addColorStop(1, palette.ocean2);
      ctx.fillStyle = ocean;
      ctx.beginPath();
      ctx.arc(X, Y, R, 0, Math.PI * 2);
      ctx.fill();
      // 4. Night: shade the half of the Earth facing away from the Sun, with
      // a soft twilight edge. Follows the simulated time.
      const [sunLon, sunLat] = subsolarPoint(new Date(satRef.current?.time ?? Date.now()));
      const night: [number, number] = [sunLon + 180, -sunLat];
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = palette.night;
      for (const radius of [90, 87, 84]) {
        ctx.beginPath();
        path(geoCircle().center(night).radius(radius)());
        ctx.fill();
      }

      // 5. Ground stations that recently received FramSat-1 (SatNOGS).
      const centreNow = projection.invert!([X, Y])!;
      ctx.fillStyle = palette.station;
      for (const station of stationsRef.current) {
        const at: [number, number] = [station.lon, station.lat];
        if (!Number.isFinite(station.lat) || geoDistance(at, centreNow) >= Math.PI / 2) continue;
        const [sx, sy] = projection(at)!;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. On top: the ground track (the last and next 50 minutes), then
      // Trondheim and the route from there to the satellite.
      ctx.globalCompositeOperation = "source-over";
      const track = trackRef.current;
      if (track) {
        ctx.lineWidth = 1.5 * dpr;
        ctx.strokeStyle = palette.track;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        path({ type: "LineString", coordinates: track.past });
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.setLineDash([2 * dpr, 5 * dpr]);
        ctx.lineCap = "round";
        ctx.beginPath();
        path({ type: "LineString", coordinates: track.future });
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const home: [number, number] = [TRONDHEIM.lon, TRONDHEIM.lat];
      const s = satRef.current;
      if (s) {
        const between = geoInterpolate(home, [s.lon, s.lat]);
        ctx.strokeStyle = palette.route;
        ctx.lineWidth = dpr;
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
        ctx.fillStyle = palette.home;
        ctx.beginPath();
        ctx.arc(hx, hy, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // The satellite's label is HTML, so it stays sharp above everything.
      if (label.current) {
        const visible = s && geoDistance([s.lon, s.lat], centre) < Math.PI / 2;
        label.current.style.opacity = visible ? "1" : "0";
        if (s && visible) {
          const [px, py] = projection([s.lon, s.lat])!;
          label.current.style.transform = `translate3d(${px / dpr}px, ${py / dpr}px, 0)`;
        }
      }

      // The darkening behind the text fades out as the whole Earth opens up.
      if (scrim.current) scrim.current.style.opacity = String(1 - open);
    };

    // Ease the view toward the satellite, unless someone just dragged it.
    // Returns whether anything is still moving.
    const follow = () => {
      let moving = false;
      if (!still) {
        const leanOn = 1 - globe.open; // no leaning while the globe is draggable
        moving = step(lean.x, pointer.x * leanOn, 0.03, 0.88, 0.002) || moving;
        moving = step(lean.y, pointer.y * leanOn, 0.03, 0.88, 0.002) || moving;
      }
      const s = satRef.current;
      if (!s || drag.active || performance.now() < drag.until) return moving;
      const lon = view.lon.x + lonDelta(view.lon.x, s.lon);
      const lat = s.lat - liftAt(globe.open);
      // Start pointed at the satellite rather than swinging over to it: an
      // opening animation would redraw the map for ~100 frames while the
      // page is still loading.
      if (still || !placed) {
        placed = true;
        view.lon.x = lon;
        view.lat.x = lat;
        return moving;
      }
      moving = step(view.lon, lon, 0.02, 0.85, 0.3) || moving;
      moving = step(view.lat, lat, 0.02, 0.85, 0.3) || moving;
      return moving;
    };

    const render = () => {
      frame = 0;
      layout();
      const moving = follow();
      draw();
      // Keep going while easing, or while waiting to swing back after a drag.
      if (moving || drag.active || performance.now() < drag.until + 50) wake();
    };

    const wake = () => {
      if (!frame && !cancelled) frame = requestAnimationFrame(render);
    };
    wakeRef.current = wake;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio, 1.5);
      el.width = Math.round(window.innerWidth * dpr);
      el.height = Math.round(window.innerHeight * dpr);
      wake();
    };

    // Dragging the whole Earth at the end of the page spins it. Only with a
    // mouse or pen, so touch scrolling keeps working on phones.
    const overGlobe = (e: PointerEvent) =>
      globe.open > 0.9 &&
      e.pointerType !== "touch" &&
      Math.hypot(e.clientX - globe.cx, e.clientY - globe.cy) < globe.r &&
      !(e.target as Element).closest("a, button, aside, input, textarea");

    const onDown = (e: PointerEvent) => {
      if (!overGlobe(e)) return;
      e.preventDefault(); // no text selection while dragging
      drag.active = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      document.documentElement.style.cursor = "grabbing";
      wake();
    };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
      if (drag.active) {
        const degPerPx = 180 / Math.PI / globe.r;
        view.lon.x -= (e.clientX - drag.x) * degPerPx;
        view.lat.x = Math.max(-85, Math.min(85, view.lat.x + (e.clientY - drag.y) * degPerPx));
        view.lon.v = view.lat.v = 0;
        drag.x = e.clientX;
        drag.y = e.clientY;
      } else {
        document.documentElement.style.cursor = overGlobe(e) ? "grab" : "";
      }
      wake();
    };
    const onUp = () => {
      if (!drag.active) return;
      drag.active = false;
      drag.until = performance.now() + HOLD_MS;
      document.documentElement.style.cursor = "";
      wake();
    };

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
      wake();
    });

    resize();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      wakeRef.current = () => {};
      document.documentElement.style.cursor = "";
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
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
