import pictures from "./pictures.json";
import type { Media } from "./types";

// What each beat shows besides the globe, by beat id, in order. Placed
// full-width before the beat's text. Count tokens in a number block are
// filled from the catalogue. A "to" that begins "of " reads as a share
// (1,777 of 2,500) rather than a change (51 to 365). Photographs (archive
// and compare blocks) come from pictures.json, the picture research, so the
// files, credits and licences are written down in one place.

type Entry = (typeof pictures)[number];
const entry = (beat: string, pick = 1): Entry => {
  const e = pictures.find((p) => p.beat === beat && p.pick === pick);
  if (!e) throw new Error(`no picture ${pick} for ${beat} in pictures.json`);
  return e;
};

// An archive block from a researched picture, with a caption written for it.
const archive = (beat: string, caption: string, pick = 1): Media => {
  const e = entry(beat, pick);
  return {
    kind: "archive",
    picture: { src: e.src, srcSmall: e.srcSmall, alt: e.alt, width: e.width, height: e.height },
    caption,
    credit: { text: e.credit, url: e.url },
  };
};

// The licence of every picture and recording, by file, for the credits list.
export const LICENCES: Record<string, string> = {
  ...Object.fromEntries(pictures.map((p) => [p.src, p.licence])),
  "/space/audio/sputnik-beep.mp3": "Public domain (NASA)",
};

export const MEDIA: Record<string, Media[]> = {
  "doves": [
    archive("doves", "The first two of the 28 Flock 1 Doves leaving the space station, 11 February 2014."),
  ],
  "cubesats": [
    archive("cubesats", "A museum copy of CUTE-I from the Tokyo Institute of Technology, one of the first six CubeSats."),
  ],
  "iss": [
    archive("iss", "Sergei Krikalev and Robert Cabana at a hatch inside Zarya, during the shuttle visit of December 1998."),
  ],
  "iridium": [
    archive("iridium", "A flare from an Iridium satellite above one of the Very Large Telescope's units in Chile."),
  ],
  "hubble": [
    archive("hubble", "Hubble's view of the core of the galaxy M100, blurred in 1993 on one side and after the repair in 1994 on the other."),
  ],
  "sts-1": [
    archive("sts-1", "Columbia lifting off from Pad 39A at the Kennedy Space Center on STS-1, 12 April 1981."),
  ],
  "kessler": [
    archive("kessler", "A NASA plot of the objects tracked in low orbit today, long after Kessler's paper."),
  ],
  "landsat-1": [
    archive("landsat-1", "The scanner's first-light image, shown in false colour and dated 25 July 1972."),
  ],
  "apollo-11": [
    archive("apollo-11", "The third stage of Apollo 11's Saturn V, photographed by the crew after they separated from it.", 2),
  ],
  "molniya": [
    archive("molniya", "A Molniya satellite on display in a building of Siberian Federal University."),
  ],
  "early-bird": [
    archive("early-bird", "Engineers Stanley Peterson and Ray Bowerman check over Early Bird, also called Intelsat I."),
  ],
  "syncom-2": [
    archive("syncom-2", "A Syncom satellite, the kind that first reached a geosynchronous orbit."),
  ],
  "echo-1": [
    archive("echo-1", "Langley engineers Edwin Kilgore and Norman Crabill look inside an Echo 1 balloon during inflation tests in Weeksville, North Carolina, in 1958."),
  ],
  "tiros-1": [
    archive("tiros-1", "The print NASA long captioned as the first television picture from space, 1 April 1960. It was taken on 2 April, at 16:08 UTC, according to the European weather centre ECMWF's check of NASA's records."),
  ],
  "vanguard-1": [
    archive("vanguard-1", "A US Navy photograph of the Vanguard TV-3 rocket exploding on its launch pad."),
  ],
  "explorer-1": [
    archive("explorer-1", "William Pickering, James Van Allen and Wernher von Braun hold up a model of Explorer 1 at the press conference after the launch."),
  ],
  "sputnik-1": [
    archive("sputnik-1", "A replica of Sputnik 1 in the Missile and Space Gallery of the National Museum of the US Air Force."),
    {
      kind: "sound",
      src: "/space/audio/sputnik-beep.mp3",
      label: "Hear a recording of Sputnik's signal",
      credit: { text: "NASA, a recording of Sputnik's signal", url: "https://commons.wikimedia.org/wiki/File:Sputnik_-_Beep.mp3" },
    },
  ],
  "first-break-up": [
    { kind: "number", from: "{count:1961-06-28}", to: "{count:1961-06-29}", label: "objects in orbit, the day before and at the end of that day" },
  ],
  telstar: [
    archive("telstar", "A Telstar satellite in the Musée des Arts et Métiers in Paris. Telstar 1 itself is still in orbit."),
    {
      kind: "map",
      map: "telstar",
      caption: "Andover, Maine, and Pleumeur-Bodou, Brittany: the two stations that talked to Telstar 1.",
    },
  ],
  "ferdinand-1": [
    archive("ferdinand-1", "A Nike-Cajun sounding rocket of the type that carried Ferdinand 1, on its launcher at Wallops, Virginia, in 1959. It is not Ferdinand itself."),
    {
      kind: "map",
      map: "ferdinand",
      caption: "A side view of Ferdinand 1's flight on 18 August 1962. The scale runs from sea level to 400 km.",
    },
  ],
  "break-ups": [
    { kind: "number", from: "{count:1969-12-31:debris}", to: "of {count:1969-12-31}", label: "objects in orbit at the end of 1969 were debris" },
  ],
  "navstar-1": [{ kind: "number", from: "45 m", to: "6.3 m", label: "the 95 per cent error radius at one GPS station on 1 May and on 3 May 2000" }],
  // The cold open already shows the map; this beat is the return to it.
  "black-brant": [archive("black-brant", "A four-stage Black Brant XII leaving Wallops, Virginia. It is the same type as the rocket launched from Andøya in 1995, not that rocket.")],
  "fengyun-1c": [
    { kind: "number", from: "{count:2007-01-10}", to: "{count:2007-01-11}", label: "objects in orbit, the day before and the day of the test" },
    archive("fengyun-1c", "The orbits of the Fengyun-1C debris a month after the test, with the space station's orbit in white."),
  ],
  "iridium-kosmos": [
    { kind: "number", from: "{count:2009-02-09}", to: "{count:2009-02-10}", label: "objects in orbit, the day before and the day of the collision" },
    archive("iridium-kosmos", "A simulation of the debris twenty minutes after the collision. The dots are simulated, not tracked objects."),
  ],
  // The last beat: the Starlink trails, then the witness one more time.
  starlink: [
    archive("starlink", "The trails of Starlink satellites across a group of galaxies, photographed at Lowell Observatory on 25 May 2019."),
    archive("vanguard-1", "Vanguard 1 itself, still up there, photographed in April 2026 through a 40.2 cm telescope at TU Delft.", 2),
  ],
  "aissat-1": [
    {
      kind: "map",
      map: "aissat",
      caption: "Why a satellite: coastal stations only hear ships near the coast, while one in orbit sees far out to sea. Sites and ranges are illustrative.",
    },
  ],
};
