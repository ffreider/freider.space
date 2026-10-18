import { ImageResponse } from "next/og";
import sharp from "sharp";
import { type SatRec, ecfToLookAngles, eciToEcf, gstime, propagate, twoline2satrec } from "satellite.js";
import type { Pass } from "@/lib/postcard";
import { PERIOD_S } from "@/lib/waterfall";
import STARS from "./stars.json";

// The postcard: the station's whole sky at the moment FramSat-1 passed over,
// as a fisheye like an astronomer's all-sky camera, with the pass drawn as
// dashes of light, one per radio packet the station received.
//
// Everything is that sky: Hipparcos stars (to magnitude 6) with their real
// colours, the Milky Way where the galactic plane was, the Sun and Moon if
// they were up, and the pass from the orbit the station tracked with. Then
// fine film grain over the whole card. Drawn on the server with sharp; the
// text comes from the image renderer, which can use the site's typeface.

export const CARD = { width: 1240, height: 1748 }; // A6 at 300 dpi

type Card = { pass: Pass; moment: Date; mine: number; where: string | null };

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

// ICRS (J2000) to galactic coordinates.
const GAL = [
  [-0.0548755604, -0.8734370902, -0.4838350155],
  [0.4941094279, -0.444829630, 0.7469822445],
  [-0.867666149, -0.1980763734, 0.4559837762],
];

// A small seeded random generator, so a postcard always comes out the same.
function random(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = () => Math.sqrt(-2 * Math.log(next() + 1e-12)) * Math.cos(2 * Math.PI * next());
  return { next, normal };
}

// Gaussian blur, approximated by three box blurs (separable, any channel count).
function blur(buf: Float32Array, w: number, h: number, sigma: number, channels = 1) {
  const r = Math.max(1, Math.round(Math.sqrt((12 * sigma * sigma) / 3 + 1) / 2));
  const tmp = new Float32Array(buf.length);
  const pass = (src: Float32Array, dst: Float32Array, horizontal: boolean) => {
    const n = horizontal ? w : h;
    const lines = horizontal ? h : w;
    const stride = horizontal ? channels : w * channels;
    for (let line = 0; line < lines; line++) {
      for (let c = 0; c < channels; c++) {
        const base = (horizontal ? line * w : line) * channels + c;
        let sum = 0;
        for (let i = -r; i <= r; i++) sum += src[base + Math.min(n - 1, Math.max(0, i)) * stride];
        for (let i = 0; i < n; i++) {
          dst[base + i * stride] = sum / (2 * r + 1);
          sum += src[base + Math.min(n - 1, i + r + 1) * stride] - src[base + Math.max(0, i - r) * stride];
        }
      }
    }
  };
  for (let k = 0; k < 3; k++) {
    pass(buf, tmp, true);
    pass(tmp, buf, false);
  }
  return buf;
}

// Local sidereal time (radians) and the alt/az of a J2000 RA/Dec (degrees).
function sky(lat: number, lst: number) {
  const phi = lat * RAD;
  return (raDeg: number, decDeg: number) => {
    const ha = lst - raDeg * RAD;
    const dec = decDeg * RAD;
    const sinAlt = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha);
    const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    const az = Math.atan2(-Math.cos(dec) * Math.sin(ha), Math.cos(phi) * Math.sin(dec) - Math.sin(phi) * Math.cos(dec) * Math.cos(ha));
    return { alt: alt * DEG, az: ((az * DEG) + 360) % 360 };
  };
}

// Low-precision Sun and Moon positions (good to a fraction of a degree, plenty here).
function sunRaDec(ms: number) {
  const d = ms / 86400000 + 2440587.5 - 2451545.0;
  const g = (357.529 + 0.98560028 * d) * RAD;
  const L = (280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const e = 23.439 * RAD;
  return { ra: (Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) * DEG + 360) % 360, dec: Math.asin(Math.sin(e) * Math.sin(L)) * DEG };
}
function moonRaDec(ms: number) {
  const d = ms / 86400000 + 2440587.5 - 2451545.0;
  const L = (218.316 + 13.176396 * d) * RAD;
  const M = (134.963 + 13.064993 * d) * RAD;
  const F = (93.272 + 13.22935 * d) * RAD;
  const lon = L + 6.289 * RAD * Math.sin(M);
  const lat = 5.128 * RAD * Math.sin(F);
  const e = 23.439 * RAD;
  const ra = Math.atan2(Math.sin(lon) * Math.cos(e) - Math.tan(lat) * Math.sin(e), Math.cos(lon));
  const dec = Math.asin(Math.sin(lat) * Math.cos(e) + Math.cos(lat) * Math.sin(e) * Math.sin(lon));
  return { ra: (ra * DEG + 360) % 360, dec: dec * DEG };
}

function starColour(bv: number): [number, number, number] {
  const t = (4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62))) / 100;
  const r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -0.1332);
  const g = t <= 66 ? 99.47 * Math.log(t) - 161.1 : 288.1 * Math.pow(t - 60, -0.0755);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5 * Math.log(t - 10) - 305.0;
  const c = [r, g, b].map((v) => Math.max(0, Math.min(255, v)));
  const white = [240, 244, 255];
  return [0, 1, 2].map((i) => 0.45 * c[i] + 0.55 * white[i]) as [number, number, number];
}

function look(satrec: SatRec, ms: number, lat: number, lon: number, altM: number) {
  const date = new Date(ms);
  const pv = propagate(satrec, date);
  if (typeof pv.position !== "object") return null;
  const l = ecfToLookAngles({ latitude: lat * RAD, longitude: lon * RAD, height: altM / 1000 }, eciToEcf(pv.position, gstime(date)));
  return { alt: l.elevation * DEG, az: l.azimuth * DEG };
}

// Text for the bottom of the card, drawn with the site's typeface.
async function googleFont(spec: string) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${spec}`, { cache: "force-cache" })).text();
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!src) throw new Error(`No TTF found for ${spec}`);
  return (await fetch(src, { cache: "force-cache" })).arrayBuffer();
}

const hhmm = (ms: number) => new Date(ms).toISOString().slice(11, 16);

async function captions(card: Card, w: number, h: number, s: number) {
  const { pass, where } = card;
  const start = Date.parse(pass.start);
  const name = pass.station.length <= 22 ? pass.station : pass.station.split(/\s+/)[0];
  const date = new Date(start).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const font = await googleFont("Schibsted+Grotesk:wght@500");
  const line = (text: string, size: number, color: string, y: number) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: y * s, display: "flex", justifyContent: "center", fontSize: size * s, color }}>{text}</div>
  );
  const png = await new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Schibsted" }}>
        {line(`FramSat-1 over ${name}`, 32, "#dce6f2", 1520)}
        {line(`${where ? `${where}, ` : ""}${date}, ${hhmm(start)} UTC`, 22, "#7c8c9e", 1566)}
        {line("Each dash is a radio packet the station received", 19, "#4c5a6c", 1622)}
      </div>
    ),
    { width: w, height: h, fonts: [{ name: "Schibsted", data: font, weight: 500 }] },
  ).arrayBuffer();
  return Buffer.from(png);
}

export async function renderCard(card: Card, scale = 1, fallbackTle?: { line1: string; line2: string }) {
  const { pass } = card;
  const s = scale;
  const w = CARD.width * s;
  const h = CARD.height * s;
  const cx = w / 2;
  const cy = h * 0.42;
  const R = w * 0.44;
  const lat = pass.lat ?? 0;
  const lon = pass.lon ?? 0;
  const start = Date.parse(pass.start);
  const end = Date.parse(pass.end);
  const mid = (start + end) / 2;
  const lst = gstime(new Date(mid)) + lon * RAD;
  const toAltAz = sky(lat, lst);
  const rng = random(pass.id);

  const proj = (alt: number, az: number): [number, number] => {
    const r = (R * (90 - alt)) / 90;
    return [cx - r * Math.sin(az * RAD), cy - r * Math.cos(az * RAD)];
  };
  const img = new Float32Array(w * h * 3);
  const add = (i: number, r: number, g: number, b: number) => {
    img[i * 3] += r;
    img[i * 3 + 1] += g;
    img[i * 3 + 2] += b;
  };
  const blob = (x: number, y: number, sigma: number, col: [number, number, number], amp: number) => {
    const rad = Math.ceil(4 * sigma);
    for (let yy = Math.max(0, Math.floor(y - rad)); yy <= Math.min(h - 1, Math.ceil(y + rad)); yy++) {
      for (let xx = Math.max(0, Math.floor(x - rad)); xx <= Math.min(w - 1, Math.ceil(x + rad)); xx++) {
        const g = amp * Math.exp(-((xx - x) ** 2 + (yy - y) ** 2) / (2 * sigma * sigma));
        add(yy * w + xx, col[0] * g, col[1] * g, col[2] * g);
      }
    }
  };

  // Sky and Milky Way, at a quarter of the resolution, smoothed and scaled up.
  const q = 4;
  const qw = Math.ceil(w / q);
  const qh = Math.ceil(h / q);
  const tex = new Float32Array(360 * 180);
  for (const [sigma, weight] of [[1.5, 0.5], [4, 0.8], [10, 1.0]] as const) {
    const layer = new Float32Array(360 * 180).map(() => rng.normal());
    blur(layer, 360, 180, sigma);
    let sd = 0;
    for (const v of layer) sd += v * v;
    sd = Math.sqrt(sd / layer.length) || 1;
    for (let i = 0; i < tex.length; i++) tex[i] += (weight * layer[i]) / sd;
  }
  const phi = lat * RAD;
  const small = new Float32Array(qw * qh * 3);
  for (let j = 0; j < qh; j++) {
    for (let i = 0; i < qw; i++) {
      const x = i * q;
      const y = j * q;
      const rr = Math.hypot(x - cx, y - cy) / R;
      if (rr > 1) continue;
      const alt = Math.max(0.5, 90 * (1 - rr));
      const az = Math.atan2(-(x - cx), -(y - cy));
      const h_ = alt * RAD;
      const sd = Math.sin(phi) * Math.sin(h_) + Math.cos(phi) * Math.cos(h_) * Math.cos(az);
      const dec = Math.asin(Math.max(-1, Math.min(1, sd)));
      const ha = Math.atan2(-Math.sin(az) * Math.cos(h_) / Math.cos(dec), (Math.sin(h_) - Math.sin(phi) * sd) / (Math.cos(phi) * Math.cos(dec)));
      const ra = lst - ha;
      const v = [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
      const g = GAL.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
      const l = ((Math.atan2(g[1], g[0]) * DEG) % 360 + 360) % 360;
      const b = Math.asin(Math.max(-1, Math.min(1, g[2]))) * DEG;
      const clump = tex[Math.min(179, Math.max(0, Math.round(b + 90))) * 360 + (Math.round(l) % 360)];
      const fromCentre = Math.min(l, 360 - l);
      const band = Math.exp(-((b / 7) ** 2)) * 0.75 + Math.exp(-((b / 18) ** 2)) * 0.25;
      const lonF = 0.45 + 0.55 * Math.exp(-((fromCentre / 55) ** 2));
      const rift = l > 10 && l < 95 ? 1 - 0.65 * Math.exp(-(((b - 1.2) / 2.2) ** 2)) : 1;
      const airmass = 1 / Math.max(Math.sin(h_), 0.05);
      const mw = Math.max(0, band * lonF * rift * (1 + 0.45 * clump)) * Math.exp(-0.18 * (airmass - 1));
      const glow = 0.05 + 0.2 * rr ** 4;
      const k = (j * qw + i) * 3;
      small[k] = glow * 28 + mw * 52;
      small[k + 1] = glow * 44 + mw * 60;
      small[k + 2] = glow * 72 + mw * 78;
    }
  }
  blur(small, qw, qh, 1.2, 3);
  for (let y = 0; y < h; y++) {
    const fy = Math.min(qh - 1.001, y / q);
    const j0 = Math.floor(fy);
    const ty = fy - j0;
    for (let x = 0; x < w; x++) {
      const fx = Math.min(qw - 1.001, x / q);
      const i0 = Math.floor(fx);
      const tx = fx - i0;
      const p = (y * w + x) * 3;
      for (let c = 0; c < 3; c++) {
        const a = small[(j0 * qw + i0) * 3 + c];
        const b = small[(j0 * qw + i0 + 1) * 3 + c];
        const d = small[((j0 + 1) * qw + i0) * 3 + c];
        const e = small[((j0 + 1) * qw + i0 + 1) * 3 + c];
        img[p + c] += (a * (1 - tx) + b * tx) * (1 - ty) + (d * (1 - tx) + e * tx) * ty;
      }
    }
  }

  // Stars.
  for (const [ra, dec, mag, bv] of STARS as [number, number, number, number][]) {
    const { alt, az } = toAltAz(ra, dec);
    if (alt < 1) continue;
    const [x, y] = proj(alt, az);
    const airmass = 1 / Math.max(Math.sin(alt * RAD), 0.05);
    const flux = Math.pow(10, -0.4 * (mag + 0.2 * (airmass - 1) - 1.0));
    const col = starColour(bv);
    blob(x, y, s * (0.75 + 0.85 * Math.sqrt(Math.min(flux, 5))), col, Math.min(1, 0.9 * Math.pow(flux, 0.45) + 0.05));
    if (mag < 1.6) blob(x, y, s * 14, col, 0.05 * Math.sqrt(Math.min(flux, 6)));
  }

  // The Sun and Moon, if they were up.
  const sun = sunRaDec(mid);
  const sunPos = toAltAz(sun.ra, sun.dec);
  if (sunPos.alt > 0) {
    const [x, y] = proj(sunPos.alt, sunPos.az);
    blob(x, y, s * 7, [255, 232, 196], 1.0);
    blob(x, y, s * 70, [255, 200, 150], 0.16);
  }
  const moon = moonRaDec(mid);
  const moonPos = toAltAz(moon.ra, moon.dec);
  if (moonPos.alt > 0) {
    const [x, y] = proj(moonPos.alt, moonPos.az);
    blob(x, y, s * 4, [255, 250, 238], 1.0);
    blob(x, y, s * 40, [200, 205, 220], 0.12);
  }

  // The pass: a faint trace, and a dash of light for every packet heard.
  const tle = pass.tle ?? fallbackTle;
  const dashes = new Float32Array(w * h);
  const trace = new Float32Array(w * h);
  const segment = (buf: Float32Array, x0: number, y0: number, x1: number, y1: number, width: number, value: number) => {
    const half = width / 2;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len2 = dx * dx + dy * dy || 1;
    for (let y = Math.max(0, Math.floor(Math.min(y0, y1) - half - 1)); y <= Math.min(h - 1, Math.ceil(Math.max(y0, y1) + half + 1)); y++) {
      for (let x = Math.max(0, Math.floor(Math.min(x0, x1) - half - 1)); x <= Math.min(w - 1, Math.ceil(Math.max(x0, x1) + half + 1)); x++) {
        const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / len2));
        const d = Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy));
        const cover = Math.max(0, Math.min(1, half + 0.5 - d)); // anti-aliased edge
        buf[y * w + x] = Math.max(buf[y * w + x], cover * value);
      }
    }
  };
  if (tle) {
    const satrec = twoline2satrec(tle.line1, tle.line2);
    const at = (ms: number) => look(satrec, ms, lat, lon, pass.altitudeM);
    let prev: [number, number] | null = null;
    for (let ms = start - 180000; ms <= end + 180000; ms += 2000) {
      const p = at(ms);
      const cur = p && p.alt > 0 ? proj(p.alt, p.az) : null;
      if (prev && cur) segment(trace, prev[0], prev[1], cur[0], cur[1], s, 0.12);
      prev = cur;
    }
    const { phase, lines, heard } = pass.ridges;
    const strength = lines.map((l) => Math.max(...l));
    const heardS = strength.filter((_, i) => heard[i]).sort((a, b) => a - b);
    const lo = heardS[Math.floor(heardS.length * 0.05)] ?? 0;
    const hi = heardS[Math.floor(heardS.length * 0.95)] ?? 1;
    lines.forEach((_, i) => {
      if (!heard[i]) return;
      const t0 = start + (phase + i * PERIOD_S) * 1000;
      const a = at(t0);
      const b = at(t0 + 5000);
      if (!a || !b || a.alt <= 0) return;
      const [x0, y0] = proj(a.alt, a.az);
      const [x1, y1] = proj(b.alt, b.az);
      const v = Math.max(0.3, Math.min(1, (strength[i] - lo) / (hi - lo || 1)));
      segment(dashes, x0, y0, x1, y1, 4.5 * s, v);
    });
  }
  for (let i = 0; i < w * h; i++) add(i, 169 * trace[i], 214 * trace[i], 255 * trace[i]);
  const glowOf = (src: Float32Array, wide: number, near: number) => {
    const g1 = blur(Float32Array.from(src), w, h, wide * s);
    const g2 = blur(Float32Array.from(src), w, h, near * s);
    return [g1, g2];
  };
  const [dWide, dNear] = glowOf(dashes, 14, 3);
  for (let i = 0; i < w * h; i++) {
    const a = dWide[i] * 3.2;
    const b = dNear[i] * 1.1;
    const d = dashes[i];
    add(i, 70 * a + 150 * b + 235 * d, 130 * a + 200 * b + 245 * d, 220 * a + 255 * b + 255 * d);
  }

  // The horizon, a gentle vignette, and the night's floor.
  const ring = new Float32Array(w * h);
  for (let k = 0; k < 720 * s; k++) {
    const a0 = (k / (720 * s)) * 2 * Math.PI;
    const a1 = ((k + 1) / (720 * s)) * 2 * Math.PI;
    segment(ring, cx + R * Math.cos(a0), cy + R * Math.sin(a0), cx + R * Math.cos(a1), cy + R * Math.sin(a1), s, 0.18);
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const rr = Math.min(1, Math.hypot(x - cx, y - cy) / R);
      const v = 1 - 0.22 * rr ** 3;
      img[i * 3] = img[i * 3] * v + 150 * ring[i] + 3;
      img[i * 3 + 1] = img[i * 3 + 1] * v + 165 * ring[i] + 5;
      img[i * 3 + 2] = img[i * 3 + 2] * v + 185 * ring[i] + 9;
    }
  }

  // Film grain: fine, monochrome, strongest in the midtones.
  const noise = new Float32Array(w * h).map(() => rng.normal());
  blur(noise, w, h, 0.5);
  let sd = 0;
  for (const v of noise) sd += v * v;
  sd = Math.sqrt(sd / noise.length) || 1;
  const out = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    const lum = (img[i * 3] + img[i * 3 + 1] + img[i * 3 + 2]) / 765;
    const g = (5 * noise[i] * (0.55 + 1.6 * lum * (1 - lum))) / sd;
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.max(0, Math.min(255, img[i * 3 + c] + g));
  }

  // Compass letters and captions on top.
  const letters = await new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
        {([["N", 0], ["E", 90], ["S", 180], ["W", 270]] as const).map(([label, az]) => {
          const [x, y] = proj(-5, az);
          return (
            <div key={label} style={{ position: "absolute", left: x - 20 * s, top: y - 13 * s, width: 40 * s, display: "flex", justifyContent: "center", fontSize: 21 * s, color: "#56647a" }}>
              {label}
            </div>
          );
        })}
      </div>
    ),
    { width: w, height: h },
  ).arrayBuffer();
  const text = await captions(card, w, h, s);
  return sharp(out, { raw: { width: w, height: h, channels: 3 } })
    .composite([{ input: Buffer.from(letters) }, { input: text }])
    .png({ compressionLevel: 8 })
    .toBuffer();
}

// The link preview: the card on a dark ground, landscape.
export async function previewImage(card: Buffer) {
  const small = await sharp(card).resize({ height: 590 }).toBuffer();
  return sharp({ create: { width: 1200, height: 630, channels: 3, background: { r: 4, g: 6, b: 11 } } })
    .composite([{ input: small, gravity: "center" }])
    .png()
    .toBuffer();
}
