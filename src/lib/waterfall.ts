import sharp from "sharp";

// Turns a SatNOGS waterfall image into ridge lines: one line of radio
// spectrum per FramSat-1 packet slot (it sends a packet every 17.02 s).
//
// The waterfall is a plot, not raw data, so the colours are mapped back to
// power through the plot's own colour bar. Stations scale their colours
// differently, so everything is measured against the image's own noise floor:
// 0 is the noise, 1 the strongest signal in the recording. Some stations
// correct for Doppler (packets sit in the middle of the band) and some don't
// (the signal sweeps across it), so the whole flat part of the band is kept.

export const PERIOD_S = 17.02;
export const POINTS = 110; // per line

export type Ridges = {
  phase: number; // seconds into the recording of the first slot
  lines: number[][]; // 0..1, POINTS values each
  heard: boolean[]; // whether a packet stands out in each slot
  clarity: number; // how clearly the pass was heard overall, for picking one
};

type Image = { data: Buffer; width: number; height: number };

const isWhite = (img: Image, x: number, y: number) => {
  const i = (y * img.width + x) * 3;
  return 765 - img.data[i] - img.data[i + 1] - img.data[i + 2] <= 30;
};

// Runs of consecutive non-white pixels along a row or column, longest first.
function runs(n: number, white: (i: number) => boolean) {
  const out: [number, number][] = [];
  let start = -1;
  for (let i = 0; i <= n; i++) {
    const on = i < n && !white(i);
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      out.push([start, i - 1]);
      start = -1;
    }
  }
  return out;
}

// The plot area as a grid of 0..1 values (top row = end of the recording).
function readPlot(img: Image) {
  const mid = Math.floor(img.height / 2);
  const cols = runs(img.width, (x) => isWhite(img, x, mid)).filter(([a, b]) => b - a > 8);
  if (cols.length < 2) throw new Error("No plot and colour bar found");
  const [plotCols, barCols] = cols;
  const longest = (x: number) =>
    runs(img.height, (y) => isWhite(img, x, y)).sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
  const plotRows = longest(Math.floor((plotCols[0] + plotCols[1]) / 2));
  const bx = Math.floor((barCols[0] + barCols[1]) / 2);
  const barRows = longest(bx);

  // Colour bar: top = strongest. Exact colours are looked up directly; any
  // other colour (anti-aliasing) goes to the nearest colour on the bar.
  const key = (i: number) => (img.data[i] << 16) | (img.data[i + 1] << 8) | img.data[i + 2];
  const lut = new Map<number, number>();
  const palette: [number, number, number, number][] = [];
  const barLen = barRows[1] - barRows[0] - 1;
  for (let y = barRows[0] + 1; y < barRows[1]; y++) {
    const i = (y * img.width + bx) * 3;
    const value = 1 - (y - barRows[0] - 1) / (barLen - 1);
    if (!lut.has(key(i))) {
      lut.set(key(i), value);
      palette.push([img.data[i], img.data[i + 1], img.data[i + 2], value]);
    }
  }
  const lookup = (i: number) => {
    const k = key(i);
    let v = lut.get(k);
    if (v === undefined) {
      let best = Infinity;
      for (const [r, g, b, value] of palette) {
        const d = (r - img.data[i]) ** 2 + (g - img.data[i + 1]) ** 2 + (b - img.data[i + 2]) ** 2;
        if (d < best) {
          best = d;
          v = value;
        }
      }
      lut.set(k, v!);
    }
    return v!;
  };

  const x0 = plotCols[0] + 2;
  const x1 = plotCols[1] - 1;
  const y0 = plotRows[0] + 1;
  const y1 = plotRows[1];
  const w = x1 - x0;
  const h = y1 - y0;
  const v = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) v[y * w + x] = lookup(((y + y0) * img.width + x + x0) * 3);
  }
  return { v, w, h };
}

const median = (a: Float32Array | number[]) => {
  const s = Float32Array.from(a).sort();
  return s[Math.floor(s.length / 2)];
};

export async function ridgesFromWaterfall(png: ArrayBuffer, durationS: number): Promise<Ridges> {
  const { data, info } = await sharp(Buffer.from(png)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const plot = readPlot({ data, width: info.width, height: info.height });
  const { h } = plot;

  // Keep the flat middle of the receiver's band; its edges roll off into the dark.
  const colMedian = Array.from({ length: plot.w }, (_, x) => {
    const col = new Float32Array(h);
    for (let y = 0; y < h; y++) col[y] = plot.v[y * plot.w + x];
    return median(col);
  });
  const centre = median(colMedian.slice(Math.floor(plot.w / 3), Math.floor((2 * plot.w) / 3)));
  const flat = colMedian.map((m, x) => (m > centre - 0.08 ? x : -1)).filter((x) => x >= 0);
  const c0 = flat[0] + 4;
  const c1 = flat[flat.length - 1] - 4;
  const w = c1 - c0;
  if (w < 40) throw new Error("Band too narrow");

  // Against this image's own noise floor.
  const sorted = new Float32Array(w * h);
  for (let y = 0; y < h; y++) sorted.set(plot.v.subarray(y * plot.w + c0, y * plot.w + c1), y * w);
  const n = Float32Array.from(sorted);
  sorted.sort();
  const floor = sorted[Math.floor(sorted.length / 2)];
  const top = sorted[Math.floor(sorted.length * 0.9997)];
  const range = Math.max(top - floor, 1e-3);
  for (let i = 0; i < n.length; i++) n[i] = Math.max(-0.5, Math.min(1, (n[i] - floor) / range));

  // Packets are ~10 kHz-wide bursts: score each row by its brightest
  // 10 kHz-wide stretch, so a narrow carrier or speckle doesn't count.
  const k = Math.max(5, Math.round((w * 10) / 44));
  const wide = new Float32Array(h);
  for (let y = 0; y < h; y++) {
    let sum = 0;
    let best = -Infinity;
    for (let x = 0; x < w; x++) {
      sum += n[y * w + x];
      if (x >= k) sum -= n[y * w + x - k];
      if (x >= k - 1) best = Math.max(best, sum / k);
    }
    wide[y] = best;
  }
  const rowNoise = median(wide);
  const mad = median(Array.from(wide, (x) => Math.abs(x - rowNoise))) + 1e-3;
  const rowOf = (t: number) => (1 - t / durationS) * (h - 1);

  // The packet grid: the phase whose slots line up with the brightest rows.
  let phase = 0;
  let bestScore = -Infinity;
  for (let p = 0; p < PERIOD_S; p += 0.1) {
    let score = 0;
    for (let t = p; t < durationS; t += PERIOD_S) {
      const r = rowOf(t);
      let m = -Infinity;
      for (let y = Math.max(0, Math.floor(r - 2)); y < Math.min(h, Math.ceil(r + 3)); y++) m = Math.max(m, wide[y]);
      if (m > rowNoise) score += m - rowNoise;
    }
    if (score > bestScore) {
      bestScore = score;
      phase = p;
    }
  }
  // Slots within 2 s of either end would be cut from the image's border.
  if (phase < 2) phase += PERIOD_S;

  const lines: number[][] = [];
  const heard: boolean[] = [];
  let clarity = 0;
  for (let t = phase; t < durationS - 2; t += PERIOD_S) {
    const r = rowOf(t);
    const ya = Math.max(0, Math.floor(r - 1.5));
    const yb = Math.min(h, Math.ceil(r + 1.5));
    const spec = new Float32Array(w).fill(-1);
    let z = -Infinity;
    for (let y = ya; y < yb; y++) {
      for (let x = 0; x < w; x++) spec[x] = Math.max(spec[x], n[y * w + x]);
      z = Math.max(z, (wide[y] - rowNoise) / (1.4826 * mad));
    }
    const pooled = Array.from({ length: POINTS }, (_, i) => {
      let m = -1;
      for (let x = Math.floor((i * w) / POINTS); x < Math.floor(((i + 1) * w) / POINTS); x++) m = Math.max(m, spec[x]);
      return m;
    });
    lines.push(
      pooled.map((x, i) => {
        const s = 0.25 * (pooled[i - 1] ?? x) + 0.5 * x + 0.25 * (pooled[i + 1] ?? x);
        return Math.round(Math.max(0, s) * 1000) / 1000;
      }),
    );
    heard.push(z > 6);
    if (z > 6) clarity += Math.min(z, 40);
  }
  return { phase: Math.round(phase * 10) / 10, lines, heard, clarity: Math.round(clarity) };
}
