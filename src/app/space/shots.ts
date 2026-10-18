import type { Shot } from "./types";

// How the globe frames each beat: one shot per beat id in chapter1.ts, from
// the concept's shot list (docs/superpowers/specs/2026-10-18-space-chapter-1-
// storytelling-design.md). Beats whose main picture is a photo, a number or a
// map (another part of the page) still get a shot, which is what shows behind
// it. Only the camera, the sky's colour and the orbits' orientation are
// staged; every dot is a catalogued object.

const ANDOYA = { lat: 69.29, lon: 16.02 };
const CANAVERAL = { lat: 28.5, lon: -80.6 };
const TYURATAM = { lat: 45.9, lon: 63.3 };

export const SHOTS: Record<string, Shot> = {
  // Act I
  "sputnik-1": { kind: "sky", place: { name: "Moscow", lat: 55.75, lon: 37.62 }, look: { az: 230, el: 30 }, light: "dusk" },
  "sputnik-2": { kind: "orbit", view: "default", focus: TYURATAM },
  "explorer-1": { kind: "orbit", view: "wide", focus: CANAVERAL, belts: true },
  "vanguard-1": { kind: "orbit", view: "default", focus: CANAVERAL },
  "tiros-1": { kind: "orbit", view: "default", focus: CANAVERAL },
  "echo-1": { kind: "sky", place: { name: "Holmdel, New Jersey", lat: 40.39, lon: -74.18 }, look: { az: 280, el: 40 }, light: "night" },
  "first-break-up": { kind: "orbit", view: "close", focus: CANAVERAL, spread: true },

  // Act II
  "starfish-prime": { kind: "orbit", view: "wide", focus: { lat: 16.73, lon: -169.53 }, belts: true },
  telstar: { kind: "orbit", view: "default", focus: { lat: 46, lon: -35 } },
  "ferdinand-1": { kind: "orbit", view: "close", focus: ANDOYA },
  "syncom-2": { kind: "orbit", view: "edge", focus: { lat: 0, lon: -55 } },
  "syncom-3": { kind: "orbit", view: "polar", focus: { lat: 0, lon: 180 } },
  "early-bird": { kind: "orbit", view: "wide", focus: { lat: 0, lon: -30 } },
  // Andenes looks south and low: the geostationary ring sits near the horizon
  // while the Molniya objects, on their long loops, pass high.
  molniya: { kind: "sky", place: { name: "Andenes", lat: 69.31, lon: 16.12 }, look: { az: 180, el: 20 }, light: "dusk" },
  "break-ups": { kind: "orbit", view: "default", focus: CANAVERAL },
  "apollo-11": { kind: "orbit", view: "wide", focus: CANAVERAL },

  // Act III
  "landsat-1": { kind: "orbit", view: "close", focus: { lat: 32.8, lon: -96.8 } },
  "navstar-1": { kind: "orbit", view: "wide", focus: { lat: 34.7, lon: -120.6 } },
  kessler: { kind: "orbit", view: "default", focus: { lat: 29.56, lon: -95.09 } },
  "sts-1": { kind: "orbit", view: "close", focus: CANAVERAL },
  "astra-1a": { kind: "sky", place: { name: "Oslo", lat: 59.91, lon: 10.75 }, look: { az: 180, el: 22 }, light: "dusk" },

  // Act IV
  hubble: { kind: "orbit", view: "close", focus: CANAVERAL },
  thor: { kind: "orbit", view: "close", focus: { lat: 60, lon: 5 } },
  "black-brant": { kind: "orbit", view: "close", focus: ANDOYA },
  iridium: { kind: "sky", place: { name: "Bergen", lat: 60.39, lon: 5.32 }, look: { az: 240, el: 45 }, light: "night" },
  iss: { kind: "orbit", view: "default", focus: TYURATAM },
  cubesats: { kind: "orbit", view: "default", focus: { lat: 62.93, lon: 40.58 } },

  // Act V
  "fengyun-1c": { kind: "orbit", view: "close", focus: { lat: 28.25, lon: 102.03 }, spread: true },
  "iridium-kosmos": { kind: "orbit", view: "close", focus: { lat: 72, lon: 98 }, spread: true },
  "aissat-1": { kind: "orbit", view: "close", focus: { lat: 72, lon: 25 } },
  doves: { kind: "orbit", view: "default", focus: { lat: 13.72, lon: 80.23 } },
  starlink: { kind: "sky", place: { name: "Leiden", lat: 52.16, lon: 4.49 }, look: { az: 300, el: 30 }, light: "dusk" },
};

// While an act card covers the screen the globe pulls back to show the whole
// sky with the story's witness picked out: Vanguard 1 (NORAD 5), launched in
// 1958 and the oldest object still in orbit.
export const WITNESS = 5;
export const WITNESS_SHOT: Shot = { kind: "orbit", view: "wide" };
