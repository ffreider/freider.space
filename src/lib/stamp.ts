// Postcard links name a moment to the minute: /postcard/20261014T0732Z.
// Kept apart from the postcard code so contact cards can make links cheaply.

export const LAUNCH = Date.UTC(2026, 8, 5, 20, 12); // FramSat-1, 5 Sep 2026, 20:12 UTC

export function stampOf(date: Date) {
  return date.toISOString().slice(0, 16).replace(/[-:]/g, "") + "Z"; // 20261014T0732Z
}

export function parseStamp(stamp: string) {
  const m = stamp.match(/^(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)Z$/);
  if (!m) return null;
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
  return stampOf(date) === stamp ? date : null; // rejects 20261399T…
}
