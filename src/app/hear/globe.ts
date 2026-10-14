import { geoCircle, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, MultiLineString } from "geojson";
import { feature, mesh } from "topojson-client";
import { subsolarPoint } from "../framsat-orbit";

// The Earth as FramSat-1 sees it: centred on the point straight below it,
// with the night side shaded and the last half hour of its ground track.
// Drawn on the live view and, larger, on the saveable postcard.

export type World = { land: Feature | FeatureCollection; borders: MultiLineString };

let loading: Promise<World> | null = null;

// The same world map file the homepage globe uses.
export function loadWorld() {
  loading ??= import("world-atlas/countries-110m.json").then((mod) => {
    const topo = mod.default as unknown as Parameters<typeof feature>[0] & {
      objects: Record<"land" | "countries", Parameters<typeof feature>[1]>;
    };
    return {
      land: feature(topo, topo.objects.land),
      borders: mesh(topo, topo.objects.countries as never, (a, b) => a !== b),
    };
  });
  return loading;
}

const COLOURS = {
  ocean1: "#0f2238",
  ocean2: "#060d18",
  land: "#22364d",
  coast: "rgba(169, 214, 255, 0.35)",
  border: "rgba(169, 214, 255, 0.12)",
  grid: "rgba(169, 214, 255, 0.07)",
  night: "rgba(0, 0, 0, 0.28)",
  track: "#a9d6ff",
  sat: "#eef2f5",
  glow: "rgba(169, 214, 255, 0.35)",
};

const graticule = geoGraticule10();

export function drawGlobe(
  ctx: CanvasRenderingContext2D,
  { x, y, r, lat, lon, track, world, date }: {
    x: number;
    y: number;
    r: number;
    lat: number;
    lon: number;
    track: [number, number][]; // [lon, lat], oldest first, ending at the satellite
    world: World | null;
    date: Date;
  },
) {
  const projection = geoOrthographic().clipAngle(90).precision(0.7).scale(r).translate([x, y]).rotate([-lon, -lat]);
  const path = geoPath(projection, ctx);

  // Atmosphere, then the ocean.
  const air = ctx.createRadialGradient(x, y, r * 0.96, x, y, r * 1.12);
  air.addColorStop(0, COLOURS.glow);
  air.addColorStop(1, "rgba(169, 214, 255, 0)");
  ctx.fillStyle = air;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.12, 0, Math.PI * 2);
  ctx.fill();
  const ocean = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 0, x, y, r);
  ocean.addColorStop(0, COLOURS.ocean1);
  ocean.addColorStop(1, COLOURS.ocean2);
  ctx.fillStyle = ocean;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  const line = Math.max(1, r / 220);
  ctx.lineWidth = line;
  ctx.strokeStyle = COLOURS.grid;
  ctx.beginPath();
  path(graticule);
  ctx.stroke();
  if (world) {
    ctx.beginPath();
    path(world.land);
    ctx.fillStyle = COLOURS.land;
    ctx.fill();
    ctx.strokeStyle = COLOURS.coast;
    ctx.stroke();
    ctx.strokeStyle = COLOURS.border;
    ctx.beginPath();
    path(world.borders);
    ctx.stroke();
  }

  // Night, with a soft twilight edge.
  const [sunLon, sunLat] = subsolarPoint(date);
  ctx.fillStyle = COLOURS.night;
  for (const radius of [90, 87, 84]) {
    ctx.beginPath();
    path(geoCircle().center([sunLon + 180, -sunLat]).radius(radius)());
    ctx.fill();
  }

  // The ground track, fading out into the past.
  ctx.strokeStyle = COLOURS.track;
  ctx.lineWidth = line * 2;
  ctx.lineCap = "round";
  for (let i = 1; i < track.length; i++) {
    ctx.globalAlpha = 0.6 * (i / track.length);
    ctx.beginPath();
    path({ type: "LineString", coordinates: [track[i - 1], track[i]] });
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // FramSat-1, at the centre.
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 0.09);
  glow.addColorStop(0, COLOURS.glow);
  glow.addColorStop(1, "rgba(169, 214, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.sat;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(3, r * 0.018), 0, Math.PI * 2);
  ctx.fill();
}
