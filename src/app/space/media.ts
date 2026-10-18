import type { Media } from "./types";

// What each beat shows besides the globe, by beat id, in order. Placed
// full-width before the beat's text. Count tokens in a number block are
// filled from the catalogue. A "to" that begins "of " reads as a share
// (1,777 of 2,500) rather than a change (51 to 365). Photographs (archive
// and compare blocks) are added here once the picture research has files
// and credits for them.

export const MEDIA: Record<string, Media[]> = {
  "first-break-up": [
    { kind: "number", from: "{count:1961-06-28}", to: "{count:1961-06-29}", label: "objects in orbit, the day before and the evening after" },
  ],
  telstar: [
    {
      kind: "map",
      map: "telstar",
      caption: "Andover, Maine, and Pleumeur-Bodou, Brittany: the two stations that talked to Telstar 1.",
    },
  ],
  "ferdinand-1": [
    {
      kind: "map",
      map: "ferdinand",
      caption: "Ferdinand 1, 18 August 1962: straight up from Andøya to about 100 km, the bottom of the aurora, and back down.",
    },
  ],
  "break-ups": [
    { kind: "number", from: "{count:1969-12-31:debris}", to: "of {count:1969-12-31}", label: "objects in orbit at the end of 1969 were debris" },
  ],
  "navstar-1": [{ kind: "number", from: "45 m", to: "6.3 m", label: "the error of one GPS receiver on 1 May and on 3 May 2000" }],
  "black-brant": [
    {
      kind: "map",
      map: "black-brant",
      caption: "The Black Brant XII, 25 January 1995: Andøya to the sea off Svalbard in 24 minutes. Scroll to run the clock.",
    },
  ],
  "fengyun-1c": [{ kind: "number", from: "{count:2007-01-10}", to: "{count:2007-01-11}", label: "objects in orbit, the day before and the day of the test" }],
  "iridium-kosmos": [{ kind: "number", from: "{count:2009-02-09}", to: "{count:2009-02-10}", label: "objects in orbit, the day before and the day of the collision" }],
  "aissat-1": [
    {
      kind: "map",
      map: "aissat",
      caption: "Why a satellite: coastal stations hear ships a few tens of kilometres out, and AISSat-1 listened from orbit over the Barents and Norwegian seas. Sites and ranges are illustrative.",
    },
  ],
};
