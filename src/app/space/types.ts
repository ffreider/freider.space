// The shapes the space story is built from, shared by the text (chapter1.ts,
// acts.ts), the globe's shots (shots.ts) and the story's blocks (media.ts).
// See docs/superpowers/specs/2026-10-18-space-chapter-1-storytelling-design.md.

export type Place = { lat: number; lon: number };

// How the globe frames a beat. "orbit" is the globe seen from space with a
// camera move; "sky" stands on the ground at a place and looks up.
export type Shot =
  | {
      kind: "orbit";
      view: "default" | "close" | "wide" | "polar" | "edge";
      focus?: Place;
      // Extras drawn for this beat only.
      belts?: boolean; // the Van Allen radiation belts as a faint torus
      spread?: boolean; // a debris cloud spreading out from its break-up
    }
  | {
      kind: "sky";
      place: Place & { name: string };
      // Where the viewer looks: azimuth (degrees from north, clockwise) and
      // elevation (degrees above the horizon) of the centre of view.
      look: { az: number; el: number };
      light: "dusk" | "night";
    };

// What a beat shows besides the globe, placed full-width before its text.
export type Credit = { text: string; url: string };
export type Picture = { src: string; alt: string; width: number; height: number };

export type Media =
  | { kind: "archive"; picture: Picture; caption: string; credit: Credit }
  | { kind: "compare"; before: Picture & { label: string }; after: Picture & { label: string }; caption: string; credit: Credit }
  // from and to are count tokens, e.g. "{count:1961-06-28}"; label is plain text.
  | { kind: "number"; from: string; to: string; label: string }
  | { kind: "map"; map: "black-brant" | "ferdinand" | "telstar" | "aissat"; caption: string }
  | { kind: "sound"; src: string; label: string; credit: Credit };

// An act card: a full-screen title between beats.
export type Act = {
  id: string;
  numeral: "I" | "II" | "III" | "IV" | "V";
  title: string;
  years: string; // "1957 to 1961"
  before: string; // id of the first beat in the act; the card goes right before it
  count: string; // a count token for the card's one number, e.g. "{count:1961-12-31}"
  witness: string; // the Vanguard 1 check-in; may use {orbits:5:YYYY-MM-DD}
};

// The cold open: shown before the title, set on 25 January 1995.
export type ColdOpen = { kicker: string; paragraphs: string[]; turn: string };
