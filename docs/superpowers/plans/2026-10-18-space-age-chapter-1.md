# The space age, chapter 1: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A long, guided scroll story at freider.space/space telling the space age from Sputnik (1957) to the first Starlink launch (2019), with every catalogued object drawn on a globe from its launch to its decay.

**Architecture:** A build-time script packs CelesTrak's SATCAT snapshot into a compact binary in `public/space/`. Small pure TypeScript modules decode it, place each object on its orbit (real height, shape and tilt; illustrative orientation and phase from a hash of its NORAD number) and count objects by kind at any date. The page renders the story text on the server from a typed beats file; a client component draws Earth and all objects with three.js, computing positions in a vertex shader from per-object orbit attributes and a story-date uniform driven by the scroll.

**Tech Stack:** Next.js 16 (App Router), TypeScript, three.js 0.128 (already a dependency), Node 22's built-in test runner (`node --test`, type stripping), CSS modules.

**Spec:** `docs/superpowers/specs/2026-10-18-space-age-chapter-1-design.md`

## Global Constraints

- Route `/space`; English only for now.
- Data: one SATCAT snapshot (`https://celestrak.org/pub/satcat.csv`), dated on the page; all counts in the text come from it.
- Objects: `ORBIT_CENTER == "EA"` with a launch date; kinds PAY (satellite), R/B (rocket body), DEB (debris), UNK (unknown).
- Colours: satellites glacier blue `#a9d6ff`, rocket bodies warm grey `#b8ab98`, debris dim `#5b6878`, on the descent's black.
- Font: Schibsted only (site variable `--font-schibsted`).
- Honesty note on the page: each dot is a real object at its real orbit height and tilt; its place along the orbit is illustrative.
- No per-visitor calls to CelesTrak. Images only public domain or licensed, credited.
- Story covers 1957-10-04 to 2019-05-24; the busiest frame (~24,000 objects) must scroll smoothly on a phone; budget 30,000 points.
- Reduced motion: the date jumps between beats; dots don't move.

## Review Focus

- A reader on a phone scrolls fast past several beats: the date must land on the right beat's date, not lag behind or overshoot.
- Objects with odd catalogue values (apogee below perigee, period missing, apogee > 100,000 km, decay before launch): skipped or clamped, never NaN positions.
- The page with JavaScript off: the full story text reads in order, with the honesty note and sources.
- WebGL unavailable: the text still works, and a still image or a plain message stands in for the globe.
- Counts quoted in the text disagree with the counter on screen: one source (`countAt`) for both, so they can't.

---

### Task 1: Pack the catalogue

**Files:**
- Create: `scripts/space-catalogue.mjs` (reads a CSV path, writes `public/space/catalogue.bin` and `src/lib/space/snapshot.json` with `{ date, objects }`)
- Create: `src/lib/space/catalogue.ts`
- Test: `src/lib/space/catalogue.test.ts`

**Interfaces:**
- Produces: binary layout, little-endian, header `u32 magic 0x53504331 ("SPC1")`, `u32 count`, then per object 32 bytes: `u32 norad`, `u16 launchDay`, `u16 decayDay` (days since 1957-10-04; `0xFFFF` = still in orbit), `u8 kind` (0 PAY, 1 R/B, 2 DEB, 3 UNK), `u8 _pad[3]`, `f32 perigeeKm`, `f32 apogeeKm`, `f32 inclinationDeg`, `f32 periodMin`, `u32 _reserved`.
- Produces: `export type SpaceObject = { norad: number; launchDay: number; decayDay: number | null; kind: 0 | 1 | 2 | 3; perigeeKm: number; apogeeKm: number; inclinationDeg: number; periodMin: number }`, `export function decodeCatalogue(buf: ArrayBuffer): SpaceObject[]`, `export function dayOf(date: Date): number`, `export const EPOCH = Date.UTC(1957, 9, 4)`.

- [ ] **Step 1: Write the failing tests** in `catalogue.test.ts`: `dayOf(new Date("1957-10-04T00:00Z")) === 0`; `dayOf(new Date("2019-05-24T00:00Z")) === 22512`; a round trip: encode two objects with a tiny encoder in the test (Sputnik 1: norad 2, launchDay 0, decayDay 91, kind 0; Vanguard 1: norad 5, launchDay 164, decayDay null, kind 0) and assert `decodeCatalogue` returns them field for field; a bad magic throws `"not a space catalogue"`.
- [ ] **Step 2: Run** `node --test src/lib/space/catalogue.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `decodeCatalogue`, `dayOf`, `EPOCH` in `catalogue.ts` (DataView over the buffer).
- [ ] **Step 4: Implement** `scripts/space-catalogue.mjs <satcat.csv>`: keep `ORBIT_CENTER == "EA"` rows with a launch date ≤ the snapshot date; skip rows with missing apogee/perigee/period; swap apogee/perigee if reversed; clamp apogee to 400,000 km; drop rows whose decay precedes launch; write the binary and `snapshot.json` (`{ "date": "<CSV download date>", "objects": <count> }`). Run it on `~/Developer/framsat-analysis/data/satcat/satcat.csv`.
- [ ] **Step 5: Run** the tests, then `ls -la public/space/catalogue.bin`. Expected: tests PASS; file present, size ≈ 8 + 32 × count bytes.
- [ ] **Step 6: Commit** `feat(space): pack the satellite catalogue`.

### Task 2: Orbits and counts

**Files:**
- Create: `src/lib/space/orbits.ts`, `src/lib/space/counts.ts`
- Test: `src/lib/space/orbits.test.ts`, `src/lib/space/counts.test.ts`

**Interfaces:**
- Consumes: `SpaceObject`, `dayOf` (Task 1; tests import with the `.ts` extension).
- Produces: `export function elements(o: SpaceObject): { a: number; e: number; i: number; raan: number; argp: number; m0: number; n: number }` (km, radians, rad/s; raan/argp/m0 from a 32-bit hash of `norad`), `export function positionAt(o: SpaceObject, seconds: number): [number, number, number]` (km, ECI-like frame, z = Earth's axis), `export function countAt(objs: SpaceObject[], day: number): { satellites: number; rocketBodies: number; debris: number; unknown: number; total: number }` (launched on or before `day`, decayed after it or never).

- [ ] **Step 1: Write the failing tests:** for Vanguard 1 (perigee 654, apogee 3969, incl 34.25, period 132.8) `positionAt` radius stays within `[6378+654-1, 6378+3969+1]` km over one period sampled 200 times and `|z| ≤ r·sin(34.25°)+1`; `elements` is deterministic (same object twice → same raan); `countAt(objs, dayOf(1957-12-31))` on the real decoded snapshot equals the count computed by the reference Python (`2`), and on 2019-12-31 equals the snapshot's reference value (record it from the analysis project when Task 1 runs).
- [ ] **Step 2: Run** `node --test src/lib/space/`. Expected: FAIL.
- [ ] **Step 3: Implement** `elements` (a = R⊕ + (apogee+perigee)/2, e from them, n from the period), `positionAt` (Kepler's equation by Newton iteration, 6 steps), `countAt`.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** `feat(space): orbit placement and counts`.

### Task 3: The page and the scroll

**Files:**
- Create: `src/app/space/page.tsx`, `src/app/space/story.tsx` (server), `src/app/space/space.module.css`, `src/app/space/chapter1.ts`, `src/app/space/scroll.ts` (client hook), `src/app/space/chapter1.test.ts`

**Interfaces:**
- Produces: `export type Beat = { id: string; date: string /* ISO day */; kicker: string /* "4 October 1957" */; title: string; body: string[] /* paragraphs, plain text with *emphasis* only */; focus?: { lat: number; lon: number }; highlight?: number[] /* NORAD ids */; sources: { label: string; url: string }[]; image?: { src: string; alt: string; credit: string } }`, `export const CHAPTER1: Beat[]`, `export function useStoryDate(beats: Beat[]): { day: number; beat: number }` (day animates between beats as their blocks cross the screen's middle; jumps under reduced motion).

- [ ] **Step 1: Write the failing test** `chapter1.test.ts`: beats are in date order; every beat has ≥ 1 source with an `https` URL; first beat's date is `1957-10-04`, last is `2019-05-24`; every `highlight` id exists in the snapshot (decode `public/space/catalogue.bin`).
- [ ] **Step 2: Run** `node --test src/app/space/chapter1.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `chapter1.ts` with the first three beats (Sputnik 1, Sputnik 2, Explorer 1) from research (Task 5 replaces/extends them), `page.tsx` + `story.tsx` (server-rendered article: title, intro, honesty note, beats, sources list), `scroll.ts`.
- [ ] **Step 4: Run** the test and `npm run build`. Expected: PASS; `/space` builds as static.
- [ ] **Step 5: Commit** `feat(space): the chapter page and story scroll`.

### Task 4: The globe

**Files:**
- Create: `src/app/space/globe.tsx` (client; dynamic `import("three")` like `descent/scripts.tsx`), `src/app/space/shaders.ts`
- Modify: `src/app/space/story.tsx` (mount `<Globe day={…} focus={…} highlight={…} />`)

**Interfaces:**
- Consumes: `decodeCatalogue` (Task 1), `elements` (Task 2, run once per object to fill attributes), `useStoryDate` (Task 3).
- Produces: `<Globe day: number; focus?: {lat, lon}; highlight?: number[] />`.

- [ ] **Step 1: Implement** Earth (the descent's `public/descent/tex/earth-day-2k.webp` / night, sun from the story date) and one `THREE.Points` with per-object attributes `a, e, i, raan, argp, m0, n, launch, decay, kind`; the vertex shader solves Kepler (3 Newton steps) for `uTime` (seconds, real-time spin, frozen under reduced motion), hides points outside `[launch, decay)` at `uDay`, colours by kind, size by kind; highlighted ids get a halo and their orbit line.
- [ ] **Step 2: Verify in the browser** (dev server, `/space`, desktop and 375 px): scrolling from beat 1 to 3 shows 2 objects, then more; a frame at 2019 draws without dropping below 50 fps on desktop (Performance panel); no console errors; WebGL off (`?nogl`) shows the text and a fallback line.
- [ ] **Step 3: Commit** `feat(space): the globe`.

### Task 5: Research

**Files:**
- Create: `docs/space/research/NN-<beat-id>.md`, one per beat in the spec's outline (27 incl. 7b and 18b)

- [ ] **Step 1: Dispatch research subagents** (one per era: 1957–61, 1962–69, 1970–89, 1990–2006, 2007–2019; Andøya beats in their eras) with the brief format: what happened (dated), numbers, people, why it mattered on the ground, one or two short primary-source quotes with attribution, 3–6 sources with URLs (NASA History, NSSDCA, ESA, Norwegian Space Agency / Andøya Space, peer-reviewed papers, contemporary press), the NORAD ids of objects to highlight, and anything commonly misstated.
- [ ] **Step 2: Cross-check** each brief's numbers against the catalogue (`countAt`) and flag conflicts in the brief.
- [ ] **Step 3: Commit** `docs(space): research briefs for chapter 1`.

### Task 6: Write the chapter

**Files:**
- Modify: `src/app/space/chapter1.ts` (all beats)

- [ ] **Step 1: Draft** every beat from its brief: 120–300 words each, concrete and specific, narrator voice (Andøya beats tell Norway's side; no invented biography).
- [ ] **Step 2: De-slop** with the humanizer skill: no inflated significance, no rule of three, no vague attributions, no em-dash runs, no closing morals.
- [ ] **Step 3: Fact-check pass:** every date, number and quote traced to its brief's source or to `countAt`; fix or cut what can't be traced.
- [ ] **Step 4: Run** `node --test src/app/space/ src/lib/space/` and `npm run build`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(space): chapter 1 text`.

### Task 7: Finish

- [ ] **Step 1: Design pass** with the frontend-design / impeccable guidance: typography scale, the year counter and object count, the small growing chart (dataviz skill), the honesty note, the sources, phone layout (text and globe take turns as on the homepage).
- [ ] **Step 2: Verify** desktop and phone widths, reduced motion, no-JS, `npm run build`, lint.
- [ ] **Step 3: Commit** `feat(space): design pass`, then show Freider the page locally before anything is pushed.
