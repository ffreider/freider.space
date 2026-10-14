import { stampOf, plateNumber, type Pass } from "@/lib/postcard";
import { PERIOD_S } from "@/lib/waterfall";

// Where everything on a plate goes, in a 400 × 566 frame (A-series paper).
// Shared by the page (vector) and the images (link previews, print), so the
// two always match.

export const W = 400;
export const H = 566;
export const INK = "#152244";
export const RED = "#c8432b";
export const PAPER = "#fbf9f4";
export const MUTE = "#8a8475";

const TOP = 104;
const BOTTOM = 407;
export const X0 = 128;
export const X1 = 352;
export const LABEL_Y = 448; // the rule above the label block

const NUMBERS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen"];

export type Note = { y: number; label: string; time: string; red: boolean };

export type PlateLayout = {
  header: [string, string];
  title: [string, string]; // "Eleven minutes", "overhead"
  ridges: { line: string; fill: string; red: boolean }[];
  notes: Note[];
  caption: string[];
  facts: { key: string; value: string; red: boolean }[];
  footer: [string, string];
};

const hhmm = (ms: number) => new Date(ms).toISOString().slice(11, 16);
const day = (ms: number) =>
  new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase();

function gapText(ms: number) {
  const minutes = Math.round(Math.abs(ms) / 60_000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}

function wrap(text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && (line + " " + word).length > width) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  return [...lines, line];
}

export function plateLayout(moment: Date, pass: Pass, mine: number, where: string | null): PlateLayout {
  const { lines, heard, phase } = pass.ridges;
  const n = lines.length;
  const start = Date.parse(pass.start);
  const slotTime = (i: number) => start + (phase + i * PERIOD_S) * 1000;
  const gap = (BOTTOM - TOP) / Math.max(1, n - 1);
  const amp = Math.min(46, gap * 6.5);

  // Lines rise from the plate's own noise level, so quiet slots lie flat and
  // only the signal stands up. The band's sloping edges are trimmed off.
  const trim = Math.round(lines[0].length * 0.06);
  const all = lines.flatMap((v) => v.slice(trim, -trim)).sort((a, b) => a - b);
  const base = all[Math.floor(all.length * 0.6)];
  // Scaled to this pass's own strongest signal, so a faint pass still shows
  // its bursts; never so far that noise alone fills the plate.
  const peak = all[Math.floor(all.length * 0.995)];
  const scale = amp / Math.max(0.3, peak - base);
  const ridges = lines.map((full, i) => {
    const v = full.slice(trim, -trim);
    const y0 = TOP + i * gap;
    const pts = v.map((a, j) => `${(X0 + ((X1 - X0) * j) / (v.length - 1)).toFixed(1)} ${(y0 - Math.max(0, a - base) * scale).toFixed(1)}`);
    const line = "M" + pts.join("L");
    // Each line hides the ones behind it, as in a ridge plot.
    return { line, fill: `${line}L${X1} ${(y0 + gap * 3).toFixed(1)}L${X0} ${(y0 + gap * 3).toFixed(1)}Z`, red: i === mine };
  });

  // Margin notes, most important first; ones that would overlap are dropped.
  // A heard slot with no other heard slot nearby is more likely a blip of
  // interference than the satellite, so the notes go by the steady signal.
  const steady = heard.map((h, i) => h && (heard[i - 1] || heard[i + 1] || heard[i - 2] || heard[i + 2]) === true);
  const first = steady.indexOf(true);
  const last = steady.lastIndexOf(true);
  let lost = -1;
  for (let i = first + 1; i < last - 1; i++) if (steady[i - 1] && !steady[i] && !steady[i + 1]) { lost = i; break; }
  let back = -1;
  if (lost > 0) for (let i = lost + 1; i <= last; i++) if (steady[i]) { back = i; break; }
  const wanted: [number, string][] = [
    [mine, "YOUR MOMENT"],
    [0, steady[0] ? "RECORDING STARTS" : "RISES"],
    [n - 1, steady[n - 1] ? "RECORDING ENDS" : "SETS"],
    [first, "FIRST PACKET"],
    [lost, "SIGNAL LOST"],
    [back, "SIGNAL BACK"],
  ];
  const notes: Note[] = [];
  for (const [i, label] of wanted) {
    if (i < 0 || i >= n) continue;
    // "Back" only makes sense next to "lost".
    if (label === "SIGNAL BACK" && !notes.some((note) => note.label === "SIGNAL LOST")) continue;
    const y = TOP + i * gap;
    if (notes.some((note) => Math.abs(note.y - y) < 10)) continue;
    notes.push({ y, label, time: hhmm(label === "YOUR MOMENT" ? moment.getTime() : slotTime(i)), red: i === mine });
  }

  const minutes = Math.round(pass.durationS / 60);
  const station = pass.station.length > 28 ? pass.station.slice(0, 26) + "…" : pass.station;
  const t = moment.getTime();
  const story =
    `Each line is seventeen seconds of radio spectrum around 435.141 MHz, heard by amateur station ` +
    `${station}${where ? ` in ${where}` : ""} as FramSat-1 crossed its sky. ` +
    (mine >= 0
      ? "The red line is your moment."
      : `Your moment was ${gapText(start - t)} ${start > t ? "before" : "after"} this pass.`);
  const plate = plateNumber(moment).toLocaleString("en-GB");

  return {
    header: [`PLATE ${plate} — RADIO OBSERVATION`, "FRAMSAT-1 · NORAD 98914"],
    title: [`${NUMBERS[minutes] ?? minutes} minute${minutes === 1 ? "" : "s"}`, "overhead"],
    ridges,
    notes,
    caption: wrap(story, 52),
    facts: [
      { key: "DATE", value: day(start), red: false },
      { key: "PASS", value: `${hhmm(start)}–${hhmm(start + pass.durationS * 1000)} UTC`, red: false },
      { key: "PACKETS HEARD", value: `${heard.filter(Boolean).length} OF ${n}`, red: false },
      { key: "YOUR MOMENT", value: `${hhmm(t)} UTC${day(t) === day(start) ? "" : `, ${day(t)}`}`, red: mine >= 0 },
    ],
    footer: [`FREIDER.SPACE/POSTCARD/${stampOf(moment)}`, `NO. ${plate}`],
  };
}
