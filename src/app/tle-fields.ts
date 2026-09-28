import type { L, Lang } from "./i18n";

// The fields of a two-line element set (TLE), by column, with plain-language
// explanations built from the actual values, in English and Norwegian.
// Columns are 1-based and inclusive, as in the format's specification.

export type TleField = {
  line: 1 | 2;
  from: number;
  to: number;
  name: L;
  explain: (text: string, lang: Lang) => string;
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

const utc = (d: Date, lang: Lang) =>
  d.toLocaleString(lang === "en" ? "en-GB" : "nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";

const checksum: L = {
  en: "A digit to catch typos (the sum of the digits, mod 10).",
  no: "Et siffer som fanger opp skrivefeil (summen av sifrene, mod 10).",
};

export const TLE_FIELDS: TleField[] = [
  {
    line: 1,
    from: 1,
    to: 1,
    name: { en: "Line number", no: "Linjenummer" },
    explain: (_, l) => (l === "en" ? "Marks this as line 1 of the pair." : "Viser at dette er linje 1 av paret."),
  },
  {
    line: 1,
    from: 3,
    to: 7,
    name: { en: "Catalogue number", no: "Katalognummer" },
    explain: (t, l) =>
      l === "en"
        ? `${t.trim()} is FramSat-1's ID in the NORAD catalogue of objects in orbit.`
        : `${t.trim()} er FramSat-1 sin ID i NORAD-katalogen over objekter i bane.`,
  },
  {
    line: 1,
    from: 8,
    to: 8,
    name: { en: "Classification", no: "Gradering" },
    explain: (t, l) =>
      t === "U"
        ? l === "en"
          ? "U: unclassified, public data."
          : "U: ugradert, offentlige data."
        : `${t}`,
  },
  {
    line: 1,
    from: 10,
    to: 17,
    name: { en: "International designator", no: "Internasjonal betegnelse" },
    explain: (t, l) =>
      l === "en"
        ? `Launched in 20${t.slice(0, 2)}, launch number ${num(t.slice(2, 5))} of the year, piece ${t.slice(5).trim()} from that launch.`
        : `Skutt opp i 20${t.slice(0, 2)}, oppskyting nummer ${num(t.slice(2, 5))} det året, objekt ${t.slice(5).trim()} fra den oppskytingen.`,
  },
  {
    line: 1,
    from: 19,
    to: 32,
    name: { en: "Epoch", no: "Epoke" },
    explain: (t, l) =>
      l === "en"
        ? `The moment these elements describe: year 20${t.slice(0, 2)}, day ${Number(t.slice(2)).toFixed(3)}, which is ${utc(epochDate(t), l)}.`
        : `Tidspunktet elementene beskriver: år 20${t.slice(0, 2)}, dag ${Number(t.slice(2)).toFixed(3)}, altså ${utc(epochDate(t), l)}.`,
  },
  {
    line: 1,
    from: 34,
    to: 43,
    name: { en: "Mean motion, 1st derivative", no: "Middelbevegelse, 1. derivert" },
    explain: (t, l) =>
      l === "en"
        ? `How fast it's speeding up as drag lowers the orbit: ${num(t)} revolutions/day² (halved, by convention).`
        : `Hvor fort den øker farten når luftmotstanden senker banen: ${num(t)} omløp/døgn² (halvert, etter konvensjon).`,
  },
  {
    line: 1,
    from: 45,
    to: 52,
    name: { en: "Mean motion, 2nd derivative", no: "Middelbevegelse, 2. derivert" },
    explain: (t, l) =>
      l === "en"
        ? `The change in that change, usually zero: ${impliedDecimal(t)}.`
        : `Endringen i endringen, som regel null: ${impliedDecimal(t)}.`,
  },
  {
    line: 1,
    from: 54,
    to: 61,
    name: { en: "B* drag term", no: "B*-luftmotstandsledd" },
    explain: (t, l) =>
      l === "en"
        ? `How strongly the thin upper atmosphere slows it down: ${impliedDecimal(t).toExponential(3)} per Earth radius.`
        : `Hvor mye den tynne øvre atmosfæren bremser den: ${impliedDecimal(t).toExponential(3)} per jordradius.`,
  },
  {
    line: 1,
    from: 63,
    to: 63,
    name: { en: "Ephemeris type", no: "Efemeridetype" },
    explain: (_, l) => (l === "en" ? "Always 0 in published TLEs." : "Alltid 0 i publiserte TLE-er."),
  },
  {
    line: 1,
    from: 65,
    to: 68,
    name: { en: "Element set number", no: "Elementsettnummer" },
    explain: (t, l) =>
      l === "en"
        ? `This is element set number ${num(t)} published for it.`
        : `Dette er elementsett nummer ${num(t)} som er publisert for den.`,
  },
  { line: 1, from: 69, to: 69, name: { en: "Checksum", no: "Kontrollsiffer" }, explain: (_, l) => checksum[l] },
  {
    line: 2,
    from: 1,
    to: 1,
    name: { en: "Line number", no: "Linjenummer" },
    explain: (_, l) => (l === "en" ? "Marks this as line 2 of the pair." : "Viser at dette er linje 2 av paret."),
  },
  {
    line: 2,
    from: 3,
    to: 7,
    name: { en: "Catalogue number", no: "Katalognummer" },
    explain: (t, l) =>
      l === "en"
        ? `${t.trim()} again, so the two lines can be matched up.`
        : `${t.trim()} igjen, så de to linjene kan kobles sammen.`,
  },
  {
    line: 2,
    from: 9,
    to: 16,
    name: { en: "Inclination", no: "Inklinasjon" },
    explain: (t, l) =>
      l === "en"
        ? `${num(t)}°: the tilt of the orbit against the equator. Just over 90° means a polar, sun-synchronous orbit.`
        : `${num(t)}°: banens helning mot ekvator. Litt over 90° betyr en polar, solsynkron bane.`,
  },
  {
    line: 2,
    from: 18,
    to: 25,
    name: { en: "Right ascension of the ascending node", no: "Rektascensjon for oppstigende knute" },
    explain: (t, l) =>
      l === "en"
        ? `${num(t)}°: where the orbit crosses the equator heading north, measured from the vernal equinox.`
        : `${num(t)}°: der banen krysser ekvator på vei nordover, målt fra vårjevndøgnspunktet.`,
  },
  {
    line: 2,
    from: 27,
    to: 33,
    name: { en: "Eccentricity", no: "Eksentrisitet" },
    explain: (t, l) =>
      l === "en"
        ? `0.${t.trim()}: how oval the orbit is. 0 is a perfect circle.`
        : `0,${t.trim()}: hvor oval banen er. 0 er en perfekt sirkel.`,
  },
  {
    line: 2,
    from: 35,
    to: 42,
    name: { en: "Argument of perigee", no: "Perigeumsargument" },
    explain: (t, l) =>
      l === "en"
        ? `${num(t)}°: where on the orbit it's closest to Earth, measured from the ascending node.`
        : `${num(t)}°: hvor i banen den er nærmest jorda, målt fra oppstigende knute.`,
  },
  {
    line: 2,
    from: 44,
    to: 51,
    name: { en: "Mean anomaly", no: "Middelanomali" },
    explain: (t, l) =>
      l === "en"
        ? `${num(t)}°: how far round its orbit it was at the epoch.`
        : `${num(t)}°: hvor langt rundt i banen den var ved epoken.`,
  },
  {
    line: 2,
    from: 53,
    to: 63,
    name: { en: "Mean motion", no: "Middelbevegelse" },
    explain: (t, l) =>
      l === "en" ? `${num(t)} laps around the Earth per day.` : `${num(t)} runder rundt jorda per døgn.`,
  },
  {
    line: 2,
    from: 64,
    to: 68,
    name: { en: "Revolution number", no: "Omløpsnummer" },
    explain: (t, l) =>
      l === "en" ? `${num(t)} orbits completed at the epoch.` : `${num(t)} fullførte omløp ved epoken.`,
  },
  { line: 2, from: 69, to: 69, name: { en: "Checksum", no: "Kontrollsiffer" }, explain: (_, l) => checksum[l] },
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
