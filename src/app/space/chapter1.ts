// Chapter 1 of the space-age story (/space): from Sputnik 1 to the first
// Starlinks. One beat per moment; as a beat's text crosses the middle of
// the screen the story date moves to its date and the globe turns to its
// place. Counts in the text are written as {count:YYYY-MM-DD} (or
// {count:YYYY-MM-DD:satellites}, …:rocketBodies, …:debris) and filled in
// from the catalogue on the server, so the text and the counter agree.

export type Beat = {
  id: string;
  date: string; // ISO day, UTC
  kicker: string; // "4 October 1957"
  title: string;
  body: string[]; // paragraphs, plain text with *emphasis* only
  focus?: { lat: number; lon: number };
  highlight?: number[]; // NORAD catalogue numbers
  sources: { label: string; url: string }[];
  image?: { src: string; alt: string; credit: string };
};

const TYURATAM = { lat: 45.92, lon: 63.34 };
const CANAVERAL = { lat: 28.5, lon: -80.57 };

export const CHAPTER1: Beat[] = [
  {
    id: "sputnik-1",
    date: "1957-10-04",
    kicker: "4 October 1957",
    title: "Two objects",
    body: [
      "A modified R-7 missile lifted off from Tyuratam in Soviet Kazakhstan with a polished aluminium ball 58 centimetres across on top. Sputnik 1 weighed 83.6 kilograms and carried two radio transmitters and batteries for about three weeks.",
      "The rocket's core stage reached orbit too, and from the ground it was the brighter of the two. That evening the catalogue of things people had put around the Earth held {count:1957-10-04} entries.",
    ],
    focus: TYURATAM,
    highlight: [1, 2],
    sources: [
      { label: "NASA History: Sputnik and the origins of the space age", url: "https://www.nasa.gov/history/sputnik/" },
      { label: "NASA NSSDCA: Sputnik 1", url: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1957-001B" },
    ],
  },
  {
    id: "sputnik-2",
    date: "1957-11-03",
    kicker: "3 November 1957",
    title: "Laika",
    body: [
      "Less than a month later Sputnik 2 carried a dog, Laika, into orbit. There was no way to bring her back. She died within hours of launch, from heat, though for decades the official account said otherwise.",
    ],
    focus: TYURATAM,
    highlight: [3],
    sources: [{ label: "NASA NSSDCA: Sputnik 2", url: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1957-002A" }],
  },
  {
    id: "explorer-1",
    date: "1958-02-01",
    kicker: "1 February 1958",
    title: "The first measurement",
    body: [
      "America's first satellite, Explorer 1, carried a Geiger counter built by James Van Allen's group at the University of Iowa. At the top of its orbit the counter went quiet. It wasn't broken: it was saturated, by a belt of charged particles trapped in Earth's magnetic field.",
    ],
    focus: CANAVERAL,
    highlight: [4],
    sources: [{ label: "NASA JPL: Explorer 1", url: "https://www.jpl.nasa.gov/missions/explorer-1" }],
  },
  {
    id: "starlink",
    date: "2019-05-24",
    kicker: "24 May 2019",
    title: "Sixty at once",
    body: [
      "A Falcon 9 from Cape Canaveral released 60 flat-packed satellites in a single stack. In the nights after, they crossed the sky as a line of lights, and astronomers started counting what a few thousand more would do to their pictures.",
      "On that day the catalogue held {count:2019-05-24} objects in orbit.",
    ],
    focus: CANAVERAL,
    highlight: Array.from({ length: 60 }, (_, k) => 44235 + k),
    sources: [{ label: "CelesTrak SATCAT: launch 2019-029", url: "https://celestrak.org/satcat/search.php?INTDES=2019-029" }],
  },
];
