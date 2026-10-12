// Tonight's Moon as a small SVG, for the favicon and home-screen icon: the
// lit part of the disc drawn from the real phase, as seen from the northern
// hemisphere (waxing lit on the right). Low precision (an hour or so), which
// is plenty at 32 pixels.

const SYNODIC = 29.530588853;                    // days from new Moon to new Moon
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);   // a known new Moon

// 0 at new Moon, 0.5 at full, back to 1
export function moonPhase(ms = Date.now()) {
  const days = (ms - NEW_MOON) / 864e5;
  return (((days / SYNODIC) % 1) + 1) % 1;
}

// The lit part of a disc of radius r at (cx, cy) as an SVG path.
export function litPath(phase: number, cx: number, cy: number, r: number) {
  const k = Math.cos(phase * 2 * Math.PI);        // 1 at new, -1 at full
  const rx = Math.abs(k) * r, waxing = phase < 0.5;
  const top = `${cx} ${cy - r}`, bottom = `${cx} ${cy + r}`;
  // the bright limb (right half when waxing), then back along the terminator
  const limb = `A ${r} ${r} 0 0 ${waxing ? 1 : 0} ${bottom}`;
  const term = `A ${rx} ${r} 0 0 ${(k > 0) === waxing ? 0 : 1} ${top}`;
  return `M ${top} ${limb} ${term} Z`;
}

export function moonSvg(size: number, { tile = false } = {}) {
  const c = size / 2, r = size * (tile ? 0.3 : 0.44), p = moonPhase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    (tile ? `<rect width="${size}" height="${size}" fill="#0a1220"/>` : "") +
    `<circle cx="${c}" cy="${c}" r="${r}" fill="#26324a"/>` +
    `<path d="${litPath(p, c, c, r)}" fill="#eef2f5"/>` +
    `</svg>`;
}
