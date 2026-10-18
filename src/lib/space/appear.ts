// When each object should appear in the story. Satellites and rocket stages
// appear on their launch day. Debris is harder: the catalogue gives every
// fragment its parent's launch date, so the 2007 Fengyun-1C cloud would
// otherwise appear in 1999, when the satellite went up. So debris from a
// break-up we have a date for appears on that date (NASA's History of
// On-orbit Satellite Fragmentations, CelesTrak; see docs/space/research),
// and all other debris appears when it was catalogued. The catalogue
// doesn't record that date either, but numbers are handed out in order: a
// number had been given out by the time any payload numbered after it
// launched. Never before the parent's launch.

export type Row = { norad: number; intl: string; name: string; kind: number; launchDay: number };

const EPOCH = Date.UTC(1957, 9, 4);
const day = (iso: string) => Math.floor((Date.parse(`${iso}T00:00:00Z`) - EPOCH) / 86_400_000);

// Break-ups with a known date: launch designator, and (where the designator
// holds unrelated debris too) the start of the fragments' name.
const BREAKUPS: { intl: string; name?: string; date: string }[] = [
  { intl: "1961-015", date: "1961-06-29" }, // Transit 4A's Ablestar stage, the first known break-up
  { intl: "1962-057", date: "1962-10-29" }, // Sputnik 29's final stage
  { intl: "1963-047", date: "1963-11-27" }, // Atlas Centaur 2
  { intl: "1964-070", date: "1964-11-05" }, // Kosmos 50, destroyed on purpose
  { intl: "1965-082", date: "1965-10-15" }, // OV2-1 Titan transtage
  { intl: "1965-108", date: "1965-12-21" }, // OV2-3 Titan transtage
  { intl: "1969-082", date: "1969-10-04" }, // OPS 7613 Agena D
  { intl: "1999-025", name: "FENGYUN 1C DEB", date: "2007-01-11" }, // Chinese anti-satellite test
  { intl: "1997-051", name: "IRIDIUM 33 DEB", date: "2009-02-10" }, // collision with Kosmos 2251
  { intl: "1993-036", name: "COSMOS 2251 DEB", date: "2009-02-10" },
];

// For each catalogue number, the earliest launch day of any satellite or
// rocket stage numbered at or after it: by then the number had been given out.
export function cataloguedBy(rows: Row[]): (norad: number) => number | null {
  const firm = rows.filter((r) => r.kind !== 2).sort((a, b) => a.norad - b.norad);
  const after = new Array<number>(firm.length);
  for (let k = firm.length - 1, low = Infinity; k >= 0; k--) after[k] = low = Math.min(low, firm[k].launchDay);
  return (norad) => {
    let lo = 0, hi = firm.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (firm[mid].norad < norad) lo = mid + 1;
      else hi = mid;
    }
    return lo < firm.length ? after[lo] : null;
  };
}

export function appearDay(r: Row, catalogued: (norad: number) => number | null): number {
  if (r.kind !== 2) return r.launchDay;
  const event = BREAKUPS.find((b) => r.intl.startsWith(b.intl) && (!b.name || r.name.startsWith(b.name)));
  if (event) return Math.max(r.launchDay, day(event.date));
  return Math.max(r.launchDay, catalogued(r.norad) ?? r.launchDay);
}
