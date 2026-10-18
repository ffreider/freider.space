import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAPTER1 } from "./chapter1.ts";
import { SHOTS } from "./shots.ts";

test("every beat has a shot, and every shot belongs to a beat", () => {
  const ids = new Set(CHAPTER1.map((b) => b.id));
  for (const b of CHAPTER1) assert.ok(SHOTS[b.id], `${b.id} has no shot`);
  for (const id of Object.keys(SHOTS)) assert.ok(ids.has(id), `shot for unknown beat ${id}`);
});

test("every place in a shot is a valid latitude and longitude", () => {
  for (const [id, s] of Object.entries(SHOTS)) {
    const places = s.kind === "sky" ? [s.place] : s.focus ? [s.focus] : [];
    for (const p of places) {
      assert.ok(Number.isFinite(p.lat) && p.lat >= -90 && p.lat <= 90, `${id}: latitude ${p.lat}`);
      assert.ok(Number.isFinite(p.lon) && p.lon >= -180 && p.lon <= 180, `${id}: longitude ${p.lon}`);
    }
  }
});

test("a sky shot looks above the ground and names its place", () => {
  for (const [id, s] of Object.entries(SHOTS)) {
    if (s.kind !== "sky") continue;
    assert.ok(s.place.name.length > 0, id);
    assert.ok(s.look.az >= 0 && s.look.az < 360, `${id}: azimuth`);
    assert.ok(s.look.el >= 0 && s.look.el <= 85, `${id}: elevation`);
  }
});

test("the shots the concept asks for are there", () => {
  assert.equal(SHOTS["syncom-2"].kind === "orbit" && SHOTS["syncom-2"].view, "edge");
  assert.equal(SHOTS["syncom-3"].kind === "orbit" && SHOTS["syncom-3"].view, "polar");
  assert.ok(SHOTS["explorer-1"].kind === "orbit" && SHOTS["explorer-1"].belts);
  for (const id of ["first-break-up", "fengyun-1c", "iridium-kosmos"]) assert.ok(SHOTS[id].kind === "orbit" && SHOTS[id].spread, id);
  for (const id of ["sputnik-1", "echo-1", "molniya", "astra-1a", "iridium", "starlink"]) assert.equal(SHOTS[id].kind, "sky", id);
});
