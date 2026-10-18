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

// Where the plot and its colour bar sit in the image, inside the white margins.
function findPlot(img: Image) {
  const mid = Math.floor(img.height / 2);
  const cols = runs(img.width, (x) => isWhite(img, x, mid)).filter(([a, b]) => b - a > 8);
  if (cols.length < 2) throw new Error("No plot and colour bar found");
  const [plotCols, barCols] = cols;
  const longest = (x: number) =>
    runs(img.height, (y) => isWhite(img, x, y)).sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
  const plotRows = longest(Math.floor((plotCols[0] + plotCols[1]) / 2));
  const bx = Math.floor((barCols[0] + barCols[1]) / 2);
  const box = { x0: plotCols[0] + 2, x1: plotCols[1] - 1, y0: plotRows[0] + 1, y1: plotRows[1] };
  return { box, bx, barRows: longest(bx) };
}

// The site's palette for thumbnails: night navy through blue to ice and white.
const THUMB_STOPS: [number, number, number, number][] = [
  [0, 10, 18, 32],
  [0.45, 30, 70, 120],
  [0.75, 169, 214, 255],
  [1, 244, 250, 255],
];

function thumbColour(v: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, v));
  let k = 0;
  while (x > THUMB_STOPS[k + 1][0]) k++;
  const [a, b] = [THUMB_STOPS[k], THUMB_STOPS[k + 1]];
  const f = (x - a[0]) / (b[0] - a[0]);
  return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f];
}

// A small picture of just the plot, without axes, labels or colour bar: the
// thumbnails in the logbook (/framsat/log). Shrinking ~1500 rows into a few
// dozen by averaging would erase the packets (each is a thin bright line),
// so each thumbnail pixel keeps the brightest point in its patch, measured
// against the recording's own noise, and is drawn in the site's colours.
export async function waterfallThumbnail(png: ArrayBuffer, width: number, height: number) {
  const { data, info } = await sharp(Buffer.from(png)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { box } = findPlot({ data, width: info.width, height: info.height });
  const w = box.x1 - box.x0;
  const h = box.y1 - box.y0;
  // Brightness of each plot pixel (viridis gets brighter as power rises).
  const lum = (x: number, y: number) => {
    const i = ((y + box.y0) * info.width + x + box.x0) * 3;
    return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  };
  // Each row averaged across about one packet's width (~10 kHz of the ~58 kHz
  // band), which quiets the noise and leaves packets as bright bars; then the
  // brightest row in each thumbnail pixel's patch, so no packet is lost.
  const k = Math.max(3, Math.round(w / 6));
  const cells = new Float32Array(width * height);
  const prefix = new Float64Array(w + 1);
  const rowAt = new Float32Array(width);
  for (let ty = 0; ty < height; ty++) {
    const y0 = Math.floor((ty * h) / height);
    const y1 = Math.max(y0 + 1, Math.floor(((ty + 1) * h) / height));
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < w; x++) prefix[x + 1] = prefix[x] + lum(x, y);
      for (let tx = 0; tx < width; tx++) {
        const c = Math.floor(((tx + 0.5) * w) / width);
        const a = Math.max(0, c - (k >> 1));
        const b = Math.min(w, a + k);
        rowAt[tx] = (prefix[b] - prefix[a]) / (b - a);
      }
      for (let tx = 0; tx < width; tx++) {
        const i = ty * width + tx;
        cells[i] = y === y0 ? rowAt[tx] : Math.max(cells[i], rowAt[tx]);
      }
    }
  }
  // Take out the receiver's band shape (dark edges), column by column, so
  // what's left is signal over each frequency's own noise.
  for (let tx = 0; tx < width; tx++) {
    const col = Float32Array.from({ length: height }, (_, ty) => cells[ty * width + tx]).sort();
    const bg = col[Math.floor(height / 2)];
    for (let ty = 0; ty < height; ty++) cells[ty * width + tx] -= bg;
  }
  // Scaled by the noise's own spread (median absolute deviation): noise
  // stays dark, anything well above it turns bright.
  const spread = Float32Array.from(cells, Math.abs).sort()[Math.floor(cells.length / 2)] || 1;
  const out = Buffer.alloc(width * height * 3);
  for (let i = 0; i < cells.length; i++) {
    const [r, g, b] = thumbColour(0.28 + 0.72 * (cells[i] / (10 * spread)));
    out[i * 3] = r;
    out[i * 3 + 1] = g;
    out[i * 3 + 2] = b;
  }
  return sharp(out, { raw: { width, height, channels: 3 } }).webp({ quality: 70 }).toBuffer();
}

// The plot area as a grid of 0..1 values (top row = end of the recording).
function readPlot(img: Image) {
  const { box, bx, barRows } = findPlot(img);

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

  const { x0, x1, y0, y1 } = box;
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
