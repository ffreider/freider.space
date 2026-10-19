import { readFileSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { geoAzimuthalEquidistant, geoCentroid, geoCircle, geoDistance, geoGraticule, geoInterpolate, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { ScrollProgress } from "./scroll-progress";
import styles from "./space.module.css";
import type { Media } from "./types";

// The story's flat maps, drawn as SVG on the server from the same land data
// the descent page uses, so they read without JavaScript. Each map is drawn
// twice, once for landscape screens and once for portrait ones (CSS shows
// one), because a map fitted to a wide window is a small strip on a phone.
// Only the scroll-linked parts (the arc being drawn, the clock, the
// satellite's footprint growing) need JavaScript; see scroll-progress.tsx.

type Lonlat = [number, number];
type Kind = Extract<Media, { kind: "map" }>["map"];

const EARTH_KM = 6371;

const world = JSON.parse(readFileSync(path.join(process.cwd(), "public/descent/countries.json"), "utf8")) as Topology;
const land = feature(world, world.objects.countries as GeometryCollection);

const ANDOYA: Lonlat = [16.02, 69.29];
const OLENEGORSK: Lonlat = [33.29, 68.15];
// The notice to embassies gave impact zones "out towards Svalbard"; this
// point is a stand-in in the sea west of the islands, not a surveyed one.
const IMPACT: Lonlat = [8, 78.5];
const ANDOVER: Lonlat = [-70.7, 44.63];
const PLEUMEUR: Lonlat = [-3.52, 48.79];

// The picture's size in SVG units and the margins left around what is
// fitted into it, with room at the bottom for the caption.
type Frame = { w: number; h: number; tall: boolean; px: number; top: number; bottom: number; left?: number };
const frames = (): Frame[] => [
  { w: 1200, h: 720, tall: false, px: 150, top: 120, bottom: 170 },
  { w: 600, h: 1000, tall: true, px: 70, top: 220, bottom: 230 },
];
// The cold open has text down its left side, so on a wide screen the map
// is fitted into the right half.
const coldFrames = (): Frame[] => [
  { w: 1200, h: 720, tall: false, px: 110, top: 150, bottom: 150, left: 520 },
  frames()[1],
];

// An azimuthal equidistant map, so distances from the centre are true, fitted
// to the given geometry and clipped to the frame to keep the markup small.
function project(f: Frame, fit: Parameters<GeoProjection["fitExtent"]>[1], centre: Lonlat) {
  const p = geoAzimuthalEquidistant()
    .rotate([-centre[0], -centre[1]])
    .fitExtent(
      [
        [f.left ?? f.px, f.top],
        [f.w - f.px, f.h - f.bottom],
      ],
      fit,
    );
  p.clipExtent([
    [-20, -20],
    [f.w + 20, f.h + 20],
  ]);
  return p;
}

// Whole units, and a coarse resampling: the maps are drawn large but are only
// there to place a few points, and the page carries every map in its HTML.
const pathOf = (p: GeoProjection) => {
  const draw = geoPath(p.precision(2)).digits(0);
  return (object: Parameters<typeof draw>[0]) => {
    const d = draw(object);
    return d && thin(d);
  };
};

// Drops points that lie within a unit or two of the straight line between
// their neighbours (Ramer-Douglas-Peucker), subpath by subpath. At the size
// the maps are drawn, nobody can tell, and it takes most of the weight off.
function thin(d: string, tolerance = 4): string {
  const keep = (pts: number[][]): number[][] => {
    if (pts.length < 3) return pts;
    const [ax, ay] = pts[0];
    const [bx, by] = pts[pts.length - 1];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let worst = 0;
    let at = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const dist = Math.abs((by - ay) * pts[i][0] - (bx - ax) * pts[i][1] + bx * ay - by * ax) / len;
      if (dist > worst) [worst, at] = [dist, i];
    }
    if (worst <= tolerance) return [pts[0], pts[pts.length - 1]];
    return [...keep(pts.slice(0, at + 1)).slice(0, -1), ...keep(pts.slice(at))];
  };
  return d
    .split("M")
    .filter(Boolean)
    .map((sub) => {
      const closed = sub.endsWith("Z");
      const pts = sub
        .replace("Z", "")
        .split("L")
        .map((pt) => pt.split(",").map(Number));
      const out = keep(pts);
      // Specks of island smaller than a few units go too (not the graticule's lines).
      const xs = out.map((pt) => pt[0]);
      const ys = out.map((pt) => pt[1]);
      if (closed && Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) < 8) return "";
      return out.length < (closed ? 3 : 2) ? "" : "M" + out.map((pt) => pt.join(",")).join("L") + (closed ? "Z" : "");
    })
    .join("");
}
const at = (p: GeoProjection, c: Lonlat) => p(c)!;
const fixed = (n: number) => n.toFixed(1);

function Ground({ p }: { p: GeoProjection }) {
  const draw = pathOf(p);
  return (
    <>
      <path d={draw(geoGraticule().step([15, 15]).precision(5)())!} className={styles.mapGrid} />
      <path d={draw(land)!} className={styles.mapLand} />
    </>
  );
}

function Place({ p, c, label, dx = 14, dy = 5, anchor = "start" }: { p: GeoProjection; c: Lonlat; label: string; dx?: number; dy?: number; anchor?: "start" | "end" | "middle" }) {
  const [x, y] = at(p, c);
  return (
    <>
      <circle cx={fixed(x)} cy={fixed(y)} r="4.5" className={styles.mapPoint} />
      <text x={fixed(x + dx)} y={fixed(y + dy)} textAnchor={anchor} className={styles.mapLabelStrong}>
        {label}
      </text>
    </>
  );
}

function BlackBrant({ f: frame, still }: { f: Frame; still?: boolean }) {
  // On a phone the clock needs its own band above the map, clear of the
  // impact label.
  const f = frame.tall && !still ? { ...frame, top: 300 } : frame;
  const points = { type: "MultiPoint" as const, coordinates: [ANDOYA, OLENEGORSK, IMPACT] };
  const p = project(f, points, geoCentroid(points) as Lonlat);
  const route = pathOf(p)({ type: "LineString", coordinates: [ANDOYA, IMPACT] })!;
  const [rx, ry] = at(p, OLENEGORSK);
  const [ix, iy] = at(p, IMPACT);
  return (
    <>
      <Ground p={p} />
      {[16, 32, 48].map((r) => (
        <circle key={r} cx={fixed(rx)} cy={fixed(ry)} r={r * (f.tall ? 1.4 : 1.2)} className={styles.mapRadar} />
      ))}
      <path d={route} className={styles.mapRouteFaint} />
      {!still && <path d={route} pathLength="1" className={styles.mapRoute} data-track />}
      {!still && <line x1={fixed(rx)} y1={fixed(ry)} x2={fixed(ix)} y2={fixed(iy)} className={styles.mapSight} data-sight />}
      <Place p={p} c={ANDOYA} label="Andøya" dx={-14} anchor="end" />
      <Place p={p} c={OLENEGORSK} label="Olenegorsk radar" dx={0} dy={f.tall ? 62 : 70} anchor="middle" />
      <g transform={`translate(${fixed(ix)} ${fixed(iy)})`}>
        <path d="M-7 -7L7 7M7 -7L-7 7" className={styles.mapCross} />
      </g>
      <text x={fixed(ix + 16)} y={fixed(iy + 5)} className={styles.mapLabelStrong}>
        Impact zone near Svalbard
      </text>
      <text x={fixed(ix + 16)} y={fixed(iy + (f.tall ? 30 : 26))} className={styles.mapLabel}>
        position illustrative
      </text>
      {!still && <circle cx={fixed(ix)} cy={fixed(iy)} r="6" className={styles.mapRocket} data-dot />}
      {!still && (
        <>
          <text x={f.px} y={f.top - (f.tall ? 170 : 70)} className={styles.mapLabel}>
            minutes since launch, of 24
          </text>
          <text x={f.px} y={f.top - (f.tall ? 105 : 4)} className={styles.mapReadout} data-readout data-max="24">
            24:00
          </text>
        </>
      )}
    </>
  );
}

// A side view, not a map: height above Andøya, to scale from 0 to 120 km.
function Ferdinand({ f }: { f: Frame }) {
  const x0 = f.tall ? 130 : 330;
  const ground = f.h - f.bottom + 20;
  const topY = f.top - 20;
  const y = (km: number) => ground - (km / 120) * (ground - topY);
  const x = f.tall ? 200 : 640;
  const label = (km: number, text: string) => (
    <text x={x0 - 14} y={fixed(y(km) + 5)} textAnchor="end" className={styles.mapLabel}>
      {text}
    </text>
  );
  const climb = `M${x} ${fixed(ground)}V${fixed(y(100))}`;
  return (
    <>
      <line x1={x0} x2={f.w - f.px / 2} y1={fixed(y(100))} y2={fixed(y(100))} className={styles.mapGuide} />
      <line x1={x0} x2={f.w - f.px / 2} y1={fixed(ground)} y2={fixed(ground)} className={styles.mapGround} />
      {label(0, "sea level")}
      {label(100, "100 km")}
      <path d={climb} data-track className={styles.mapUp} />
      <circle cx={x} cy={fixed(y(100))} r="6" className={styles.mapRocket} data-dot data-mode="updown" />
      <text x={x + 24} y={fixed(y(100) - 12)} className={styles.mapLabelStrong}>
        Ferdinand 1, about 100 km
      </text>
      <circle cx={x} cy={fixed(ground)} r="4.5" className={styles.mapPoint} />
      <text x={x + 14} y={fixed(ground + 28)} className={styles.mapLabelStrong}>
        Andøya
      </text>
    </>
  );
}

function Telstar({ f }: { f: Frame }) {
  const points = { type: "MultiPoint" as const, coordinates: [ANDOVER, PLEUMEUR] };
  const p = project(f, points, geoCentroid(points) as Lonlat);
  const link = pathOf(p)({ type: "LineString", coordinates: [ANDOVER, PLEUMEUR] })!;
  const [mx, my] = at(p, geoInterpolate(ANDOVER, PLEUMEUR)(0.5) as Lonlat);
  const [ex, ey] = at(p, PLEUMEUR);
  const km = Math.round((geoDistance(ANDOVER, PLEUMEUR) * EARTH_KM) / 100) * 100;
  return (
    <>
      <Ground p={p} />
      <path d={link} className={styles.mapLinkFaint} />
      <path d={link} pathLength="1" className={styles.mapLink} data-track />
      <Place p={p} c={ANDOVER} label="Andover, Maine" dx={-8} dy={34} anchor="start" />
      <Place p={p} c={PLEUMEUR} label="Pleumeur-Bodou, Brittany" dx={8} dy={f.tall ? -20 : 34} anchor="end" />
      <circle cx={fixed(ex)} cy={fixed(ey)} r="9" className={styles.mapPulse} data-dot />
      <text x={f.tall ? f.w / 2 : fixed(mx)} y={f.tall ? f.top - 40 : fixed(my - 22)} textAnchor="middle" className={styles.mapLabelStrong}>
        {km.toLocaleString("en-GB")} km apart on the ground
      </text>
      <text x={f.tall ? f.w / 2 : fixed(mx)} y={f.tall ? f.top - 10 : fixed(my + 8)} textAnchor="middle" className={styles.mapLabel}>
        The moving ring is the signal, via the satellite
      </text>
    </>
  );
}

// Coastal stations hear ships only near the coast; a satellite sees everything
// to its horizon. The station marks are schematic (their sites and reach are
// not measured), which the map says in its own words.
const COAST: Lonlat[] = [
  [6.15, 62.47],
  [10.4, 63.43],
  [14.4, 67.28],
  [16.12, 69.31],
  [18.96, 69.65],
  [23.68, 70.66],
  [31.11, 70.37],
];
// AISSat-1 flew at about 567 by 580 km (research brief 23).
const SATELLITE_KM = 570;
const deg = (rad: number) => (rad * 180) / Math.PI;

function Aissat({ f }: { f: Frame }) {
  const centre: Lonlat = [28, 73];
  const horizon = deg(Math.acos(EARTH_KM / (EARTH_KM + SATELLITE_KM)));
  const footprint = geoCircle().center(centre).radius(horizon)();
  const p = project(f, footprint, centre);
  const draw = pathOf(p);
  const reach = Math.round(((horizon * Math.PI) / 180) * EARTH_KM / 100) * 100;
  const [ax, ay] = at(p, COAST[3]);
  const [cx, cy] = at(p, centre);
  const lx = f.tall ? f.w / 2 : ax - 110;
  // On a phone the label goes under the circle, clear of it.
  const ly = f.tall ? at(p, [centre[0], centre[1] - horizon])[1] + 70 : ay + 88;
  return (
    <>
      <Ground p={p} />
      <path d={draw(footprint)!} className={styles.mapFootprint} />
      {COAST.map((c, k) => (
        <circle key={k} cx={fixed(at(p, c)[0])} cy={fixed(at(p, c)[1])} r="6" className={styles.mapRing} />
      ))}
      <circle cx={fixed(cx)} cy={fixed(cy)} r="5" className={styles.mapSatellite} />
      <text x={fixed(cx)} y={fixed(cy - 18)} textAnchor="middle" className={styles.mapLabelStrong}>
        AISSat-1 overhead
      </text>
      {f.tall ? (
        <>
          <text x={f.w / 2} y={f.top - 110} textAnchor="middle" className={styles.mapLabelStrong}>
            A satellite about {SATELLITE_KM} km up sees
          </text>
          <text x={f.w / 2} y={f.top - 80} textAnchor="middle" className={styles.mapLabelStrong}>
            about {reach.toLocaleString("en-GB")} km in every direction
          </text>
          <text x={f.w / 2} y={f.top - 50} textAnchor="middle" className={styles.mapLabel}>
            the large circle, illustrative
          </text>
        </>
      ) : (
        <>
          <text x={f.w / 2} y={f.top - 70} textAnchor="middle" className={styles.mapLabelStrong}>
            A satellite about {SATELLITE_KM} km up sees about {reach.toLocaleString("en-GB")} km in every direction
          </text>
          <text x={f.w / 2} y={f.top - 40} textAnchor="middle" className={styles.mapLabel}>
            the large circle, illustrative
          </text>
        </>
      )}
      <line x1={fixed(ax)} y1={fixed(ay)} x2={fixed(lx)} y2={fixed(ly - 28)} className={styles.mapGuide} />
      <text x={fixed(lx)} y={fixed(ly)} textAnchor="middle" className={styles.mapLabelStrong}>
        A coastal station hears only ships near the coast
      </text>
      <text x={fixed(lx)} y={fixed(ly + (f.tall ? 28 : 24))} textAnchor="middle" className={styles.mapLabel}>
        the small marks, sites and reach illustrative
      </text>
    </>
  );
}

const SCENES: Record<Kind, { title: string; desc: string; scene: (f: Frame) => ReactNode }> = {
  "black-brant": {
    title: "The Black Brant XII's flight, 25 January 1995",
    desc: "A dark map of northern Norway, Svalbard and the Kola Peninsula. A line runs from Andøya, where the rocket launched, towards Svalbard, where it came down 24 minutes later. The Olenegorsk early-warning radar on the Kola Peninsula is marked, and a clock counts the 24 minutes.",
    scene: (f) => <BlackBrant f={f} />,
  },
  ferdinand: {
    title: "Ferdinand 1's height above Andøya",
    desc: "A side view of height from sea level to 120 kilometres. The rocket climbs straight up to about 100 kilometres above Andøya and comes back down.",
    scene: (f) => <Ferdinand f={f} />,
  },
  telstar: {
    title: "The Telstar link across the Atlantic",
    desc: "A map of the North Atlantic with two ground stations marked, Andover in Maine and Pleumeur-Bodou in Brittany, joined by a line across the ocean.",
    scene: (f) => <Telstar f={f} />,
  },
  aissat: {
    title: "What AISSat-1 could hear that coastal stations could not",
    desc: "A map of the Norwegian and Barents seas. Small marks along the Norwegian coast stand for coastal radio stations, which hear ships only near the coast. One large circle shows the area a satellite about 570 kilometres up can see. Both are illustrative.",
    scene: (f) => <Aissat f={f} />,
  },
};

// The cold open's backdrop: the same Arctic map, still, without the clock.
export function ColdOpenMap() {
  return (
    <>
      {coldFrames().map((f) => (
        <svg key={f.w} viewBox={`0 0 ${f.w} ${f.h}`} preserveAspectRatio="xMidYMid slice" className={f.tall ? styles.mapTall : styles.mapWide} aria-hidden="true">
          <BlackBrant f={f} still />
        </svg>
      ))}
    </>
  );
}

export function MapBlock({ map, caption }: { map: Kind; caption: string }) {
  const { title, desc, scene } = SCENES[map];
  return (
    <ScrollProgress className={map === "black-brant" ? styles.mapBlockLong : styles.mapBlock}>
      <figure className={styles.mapSticky} data-map={map}>
        {frames().map((f) => (
          <svg key={f.w} viewBox={`0 0 ${f.w} ${f.h}`} className={f.tall ? styles.mapTall : styles.mapWide} role="img" aria-label={`${title}. ${desc}`}>
            {scene(f)}
          </svg>
        ))}
        <figcaption className={styles.mediaCaption}>{caption}</figcaption>
      </figure>
    </ScrollProgress>
  );
}
