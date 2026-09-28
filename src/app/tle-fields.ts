// The fields of a two-line element set (TLE), by column, with plain-language
// explanations built from the actual values. Columns are 1-based and
// inclusive, as in the format's specification.

export type TleField = {
  line: 1 | 2;
  from: number;
  to: number;
  name: string;
  explain: (text: string) => string;
};

const num = (text: string) => Number(text.trim());

// "Implied decimal point" notation used for B* and the second derivative:
// " 22116-3" means 0.22116 × 10⁻³.
export function impliedDecimal(text: string) {
  const t = text.trim();
  if (!t) return 0;
  const sign = t.startsWith("-") ? -1 : 1;
  const body = t.replace(/^[-+]/, "");
  const match = body.match(/^(\d+)([-+]\d)$/);
  if (!match) return 0;
  return sign * Number(`0.${match[1]}`) * 10 ** Number(match[2]);
}

// TLE epochs are a two-digit year plus a fractional day of the year.
export function epochDate(text: string) {
  const year = 2000 + num(text.slice(0, 2));
  const day = Number(text.slice(2));
  return new Date(Date.UTC(year, 0, 1) + (day - 1) * 86_400_000);
}

const utc = (d: Date) =>
  d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";

export const TLE_FIELDS: TleField[] = [
  { line: 1, from: 1, to: 1, name: "Line number", explain: () => "Marks this as line 1 of the pair." },
  {
    line: 1,
    from: 3,
    to: 7,
    name: "Catalogue number",
    explain: (t) => `${t.trim()} is FramSat-1's ID in the NORAD catalogue of objects in orbit.`,
  },
  {
    line: 1,
    from: 8,
    to: 8,
    name: "Classification",
    explain: (t) => (t === "U" ? "U: unclassified, public data." : `Classification ${t}.`),
  },
  {
    line: 1,
    from: 10,
    to: 17,
    name: "International designator",
    explain: (t) =>
      `Launched in 20${t.slice(0, 2)}, launch number ${num(t.slice(2, 5))} of the year, piece ${t.slice(5).trim()} from that launch.`,
  },
  {
    line: 1,
    from: 19,
    to: 32,
    name: "Epoch",
    explain: (t) =>
      `The moment these elements describe: year 20${t.slice(0, 2)}, day ${Number(t.slice(2)).toFixed(3)}, which is ${utc(epochDate(t))}.`,
  },
  {
    line: 1,
    from: 34,
    to: 43,
    name: "Mean motion, 1st derivative",
    explain: (t) =>
      `How fast it's speeding up as drag lowers the orbit: ${num(t)} revolutions/day² (halved, by convention).`,
  },
  {
    line: 1,
    from: 45,
    to: 52,
    name: "Mean motion, 2nd derivative",
    explain: (t) => `The change in that change, usually zero: ${impliedDecimal(t)}.`,
  },
  {
    line: 1,
    from: 54,
    to: 61,
    name: "B* drag term",
    explain: (t) =>
      `How strongly the thin upper atmosphere slows it down: ${impliedDecimal(t).toExponential(3)} per Earth radius.`,
  },
  { line: 1, from: 63, to: 63, name: "Ephemeris type", explain: () => "Always 0 in published TLEs." },
  {
    line: 1,
    from: 65,
    to: 68,
    name: "Element set number",
    explain: (t) => `This is element set number ${num(t)} published for it.`,
  },
  { line: 1, from: 69, to: 69, name: "Checksum", explain: () => "A digit to catch typos (sum of the digits, mod 10)." },
  { line: 2, from: 1, to: 1, name: "Line number", explain: () => "Marks this as line 2 of the pair." },
  {
    line: 2,
    from: 3,
    to: 7,
    name: "Catalogue number",
    explain: (t) => `${t.trim()} again, so the two lines can be matched up.`,
  },
  {
    line: 2,
    from: 9,
    to: 16,
    name: "Inclination",
    explain: (t) =>
      `${num(t)}°: the tilt of the orbit against the equator. Just over 90° means a polar, sun-synchronous orbit.`,
  },
  {
    line: 2,
    from: 18,
    to: 25,
    name: "Right ascension of the ascending node",
    explain: (t) =>
      `${num(t)}°: where the orbit crosses the equator heading north, measured from the vernal equinox.`,
  },
  {
    line: 2,
    from: 27,
    to: 33,
    name: "Eccentricity",
    explain: (t) => `0.${t.trim()}: how oval the orbit is. 0 is a perfect circle.`,
  },
  {
    line: 2,
    from: 35,
    to: 42,
    name: "Argument of perigee",
    explain: (t) => `${num(t)}°: where on the orbit it's closest to Earth, measured from the ascending node.`,
  },
  {
    line: 2,
    from: 44,
    to: 51,
    name: "Mean anomaly",
    explain: (t) => `${num(t)}°: how far round its orbit it was at the epoch.`,
  },
  {
    line: 2,
    from: 53,
    to: 63,
    name: "Mean motion",
    explain: (t) => `${num(t)} laps around the Earth per day.`,
  },
  {
    line: 2,
    from: 64,
    to: 68,
    name: "Revolution number",
    explain: (t) => `${num(t)} orbits completed at the epoch.`,
  },
  { line: 2, from: 69, to: 69, name: "Checksum", explain: () => "A digit to catch typos (sum of the digits, mod 10)." },
];

export type TleSegment = { text: string; field?: number };

// Split a TLE line into runs of text, tagging the ones that belong to a field.
export function segments(line: string, lineNo: 1 | 2): TleSegment[] {
  const out: TleSegment[] = [];
  let col = 1;
  const fields = TLE_FIELDS.map((f, i) => ({ ...f, i })).filter((f) => f.line === lineNo);
  for (const f of fields) {
    if (f.from > col) out.push({ text: line.slice(col - 1, f.from - 1) });
    out.push({ text: line.slice(f.from - 1, f.to), field: f.i });
    col = f.to + 1;
  }
  if (col <= line.length) out.push({ text: line.slice(col - 1) });
  return out;
}
