import assert from "node:assert/strict";
import { test } from "node:test";
import { appearDay, cataloguedBy, type Row } from "./appear.ts";

const day = (iso: string) => Math.floor((Date.parse(`${iso}T00:00:00Z`) - Date.UTC(1957, 9, 4)) / 86_400_000);

const rows: Row[] = [
  { norad: 25730, intl: "1999-025A", name: "FENGYUN 1C", kind: 0, launchDay: day("1999-05-10") },
  { norad: 29000, intl: "1999-025XY", name: "FENGYUN 1C DEB", kind: 2, launchDay: day("1999-05-10") },
  { norad: 22675, intl: "1993-036A", name: "COSMOS 2251", kind: 0, launchDay: day("1993-06-16") },
  { norad: 22700, intl: "1993-036C", name: "SL-8 DEB", kind: 2, launchDay: day("1993-06-16") },
  { norad: 34000, intl: "1993-036KZ", name: "COSMOS 2251 DEB", kind: 2, launchDay: day("1993-06-16") },
  { norad: 23000, intl: "1993-050A", name: "SOME SAT", kind: 0, launchDay: day("1994-01-20") },
  { norad: 30000, intl: "2006-050A", name: "OTHER SAT", kind: 0, launchDay: day("2006-11-01") },
  { norad: 35000, intl: "2009-020A", name: "LATER SAT", kind: 0, launchDay: day("2009-05-01") },
];

test("debris from a dated break-up appears on the day of the break-up", () => {
  const by = cataloguedBy(rows);
  assert.equal(appearDay(rows[1], by), day("2007-01-11"));
  assert.equal(appearDay(rows[4], by), day("2009-02-10"));
});

test("other debris appears no earlier than it can have been catalogued", () => {
  // Debris numbered 30500 was given its number after satellite 30000
  // launched (November 2006), whatever its parent's launch date. An old
  // satellite numbered late (31000, launched 1962) must not pull that back.
  const late: Row[] = [
    ...rows,
    { norad: 31000, intl: "1962-099A", name: "OLD SAT CATALOGUED LATE", kind: 0, launchDay: day("1962-10-02") },
    { norad: 30500, intl: "1993-050C", name: "SOME SAT DEB", kind: 2, launchDay: day("1994-01-20") },
  ];
  assert.equal(appearDay(late[late.length - 1], cataloguedBy(late)), day("2006-11-01"));
});

test("debris that shares a designator with a dated break-up but isn't from it keeps its own date", () => {
  // SL-8 DEB 22700 shares Cosmos 2251's designator; only satellites numbered
  // below it constrain it, and the latest of those launched with it.
  assert.equal(appearDay(rows[3], cataloguedBy(rows)), day("1993-06-16"));
});

test("satellites and rocket stages appear on their launch day", () => {
  const by = cataloguedBy(rows);
  assert.equal(appearDay(rows[0], by), day("1999-05-10"));
  assert.equal(appearDay(rows[2], by), day("1993-06-16"));
});

test("debris never appears before its parent's launch", () => {
  const early: Row[] = [
    { norad: 100, intl: "1960-001A", name: "X", kind: 0, launchDay: day("1960-01-01") },
    { norad: 90, intl: "1961-001C", name: "Y DEB", kind: 2, launchDay: day("1961-06-01") },
  ];
  assert.equal(appearDay(early[1], cataloguedBy(early)), day("1961-06-01"));
});
