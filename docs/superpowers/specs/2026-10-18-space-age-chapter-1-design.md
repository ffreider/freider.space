# The space age, chapter 1: how we got here (1957–2019)

Design for the first chapter of a three-chapter story on freider.space.
Chapter 2 (the present, live) and chapter 3 (the future, the filed
constellations and what they mean for us) come later and are out of scope
here, but chapter 1 is built so they can follow on the same page and engine.

## Intent

Tell the true story of the space age, from Sputnik to the first Starlink
launch, told through the objects themselves. The reader scrolls through
62 years and watches the sky above Earth fill up, one real object at a
time, while a written story explains who put them there, why, and what it
changed down here.

In Freider's words: *beautiful first and inspirational, but also
educational*; *seriously long*; *a true story of the space era, how we got
here, done in a genuine way, not some AI slop thing.*

Why it matters: the coming chapters argue that the next few years change
orbit more than the last sixty did. That argument only lands if the
reader has felt how slowly, and how deliberately, the first sixty years
happened. Chapter 1 earns chapter 2's "and then, in 2019…".

## Goals

- **True.** Every dot on the globe is a real catalogued object, shown
  from its launch date until it fell back (or until today). Every number in
  the text is counted from the data or cited. Every claim has a source.
- **Long and patient.** A full sitting: roughly 30–40 story beats across
  the six decades, each with its own moment on the globe. It should be
  possible to read it like a long magazine piece.
- **Beautiful.** The same visual language as the homepage descent: dark,
  real Earth, quiet type (Schibsted), glacier blue, fine detail. The
  globe is the main image and stays on screen throughout.
- **Educational by showing.** Orbits, altitudes and the difference
  between a satellite, a spent rocket stage and debris are explained by
  what's on screen at that moment, not in sidebars.
- **Human.** People, places and consequences down here: the weather
  forecast that got better, the TV signal that crossed the Atlantic, the
  GPS in a phone, the debris cloud someone created on purpose.

## Non-goals (this chapter)

- The present day live (chapter 2) and the future plans (chapter 3).
- A free-roaming explorer. The reader is guided; a few moments let them
  touch the globe (drag, hover an object), but there's no open sandbox yet.
- Crewed spaceflight as its own history. Gagarin, Apollo, the Shuttle and
  the ISS appear where they shaped what's in orbit, but this is the story
  of the sky filling up, not of astronauts.
- Norwegian. English first; the site's /no version can follow once the
  English text is settled (the descent's text system already supports it).

## Anti-goals (failure even if it works)

- **AI-sounding prose**: puffed-up significance ("a pivotal moment that
  forever changed…"), the rule of three, vague attributions, filler
  transitions, em-dash strings, every paragraph ending in a moral. The
  text should read like a good science journalist wrote it: concrete,
  specific, dry where it can be, warm where it earns it.
- **Decorative data**: dots that look like satellites but aren't, counts
  that are rounded into rhetoric, charts for the sake of charts.
- **A timeline of facts.** It has to be a story with turns, not a list of
  launches with dates.
- **Slow to load or janky to scroll.** 23,000+ objects on a phone has to
  stay smooth.

## Constraints

- Lives on freider.space (Next.js 16, Vercel Hobby), public. Built like
  the descent: server-rendered text (search engines and no-JS readers get
  the whole story), the visuals in client scripts.
- Data: CelesTrak's SATCAT (public, `https://celestrak.org/pub/satcat.csv`,
  ~71,000 objects: name, international designator, type, owner, launch and
  decay dates, period, inclination, apogee, perigee). It's fetched at build
  time (or kept as a trimmed snapshot in the repo) and shipped to the
  browser compactly. No per-visitor calls to CelesTrak.
- Rights: only public-domain or properly licensed images (NASA, ESA with
  credit, Wikimedia with licence), credited on the page. Short quotes from
  primary sources, attributed.

## How it works

### The globe and the objects

- Earth as in the descent (day/night textures, real sun), seen from far
  enough out that geostationary orbit fits (~42,000 km).
- At any point in the story there's a **story date**. Every catalogued
  object launched before it and not yet decayed is drawn.
- **Where each object is**: its orbit's height and tilt are real (from
  SATCAT apogee, perigee, inclination); where along the orbit it is, and
  the orbit's orientation, are not in SATCAT, so they're spread evenly and
  stated as such on the page ("each dot is a real object in its real
  orbit height and tilt; its place along the orbit is illustrative"). The
  dots move at their real orbital speed (from the period) so low orbits
  visibly race and geostationary ones hang still.
- **Colour by kind**: working satellites (glacier blue), spent rocket
  stages (warm grey), debris (dim, fine). Fallen objects fade out on their
  decay date.
- **Catalogue honesty**: debris is shown from the date of the event that
  made it (its launch date in SATCAT), even though much of it was only
  catalogued later. The page says so where it matters.

### The story and the scroll

- A long scroll, like the descent. Each beat is a block of text on one
  side (on phones, text and globe take turns as on the homepage); as a
  beat comes in, the story date animates to that beat's date and the
  globe turns to where the event happened (a launch site, an orbit, a
  station on the ground).
- Between beats the date runs forward and you watch the sky fill: a
  small, quiet year counter and a count of objects in orbit.
- Some beats highlight specific objects (Sputnik 1, Vanguard 1, Telstar,
  Syncom 3, the Iridium constellation, the Fengyun-1C debris cloud, the
  first 60 Starlinks) by name, with their real orbit drawn.

### Draft outline (to be refined by research)

1. **4 October 1957.** Sputnik 1 and its rocket stage: the sky goes from
   empty to two. The beep, heard by amateurs worldwide.
2. Sputnik 2 and Laika; the first casualty.
3. Explorer 1 and the Van Allen belts: the first science from orbit.
4. Vanguard 1, still up there today, the oldest object in orbit.
5. 1960: TIROS-1 and the first weather picture from space.
6. Echo: a balloon you could see, bouncing radio across a continent.
7. 1962: Telstar and live TV across the Atlantic; Ariel-1 and Starfish
   Prime (a nuclear test in space that killed satellites).
7b. 1962: the first rocket launched from Andøya, Norway's way into space
   (a sounding rocket, not an orbit; details to verify in research).
8. 1963–64: Syncom and the geostationary idea (Arthur C. Clarke, 1945)
   made real; the 1964 Tokyo Olympics broadcast.
9. Early Bird / Intelsat 1: commercial satellites begin.
10. Molniya orbits: why the Soviet Union, so far north, needed a
    different kind of orbit (and why Norway cares too).
11. The first debris: rocket stages breaking up, the 1960s fragments.
12. Apollo era, briefly, as context.
13. 1972: Landsat and seeing Earth change.
14. 1978: the first Navstar GPS satellite.
15. Kessler's 1978 paper: the warning about a debris cascade.
16. The 1980s: the Shuttle, Mir, the geostationary belt filling up.
17. 1990: Thor and Norway's own TV satellites; Hubble.
18. The 1990s dot-com dream: Iridium, Globalstar, Teledesic; Iridium's
    bankruptcy and its flares in the night sky.
18b. January 1995: the Norwegian rocket incident. A science rocket from
    Andøya is briefly taken for a possible nuclear attack, and Russia's
    "nuclear briefcase" is activated.
19. 1998–2000: the ISS begins.
20. Cubesats (1999 standard), and the first student satellites.
21. 2007: China's anti-satellite test destroys Fengyun-1C; the biggest
    single debris cloud.
22. 2009: Iridium 33 and Kosmos 2251 collide; the first accidental
    satellite collision.
23. 2010: AISSat-1, Norway's first own satellite.
24. 2013–17: Planet's Dove flocks; constellations of small satellites.
25. **24 May 2019**: 60 Starlink satellites, seen as a train of lights
    across the sky. Astronomers notice. End of chapter 1: "and then…"

### Writing process

1. **Research brief per beat**: what happened, dates, numbers, who, why
   it mattered, with sources (NASA history, ESA, NSSDCA, Space-Track /
   CelesTrak for objects, contemporary newspapers, Kessler & Cour-Palais
   1978, peer-reviewed papers). Research is done by subagents and checked.
2. **Draft** in Freider's voice: first person only where he's genuinely
   in it (Norway, Andøya, student satellites), otherwise a plain narrator.
3. **De-slop pass** with the humanizer skill, then a fact-check pass that
   ties every number and date to a source or to the catalogue.
4. Freider reads and edits before anything goes live.

### Visual design

- Uses the frontend-design / impeccable guidance and the descent's
  tokens. The globe stays the hero; text blocks are calm and readable.
- Data visuals (the count of objects over time, by kind) follow the
  dataviz skill: one small chart that grows as you scroll, not a
  dashboard.
- Reduced motion: the date jumps instead of animating; dots don't move.

## Freider's own threads

- In chapter 1, Norway through Andøya: the first launch from Andøya
  (1962) and the 1995 rocket incident. Told by the narrator; they're
  Freider's connection, not his memories.
- In chapter 2 (later), in the first person: SelfieSat (Orbit NTNU),
  FramSat-1 (launched 2026 from Andøya on Spectrum, the first orbital
  launches from Andøya), NORSTEC. Nothing about his life is written
  without his facts and his review.

## Decided by Freider

- Three chapters: past, present, future; build chapter 1 first.
- Beautiful and inspirational first, educational throughout.
- Seriously long; genuine, not AI-generic.
- Guided story, with some freedom to look around.

## Claude's calls after the builder check

- **Blue means satellite (payload), working or not.** SATCAT says nothing
  about when a satellite stopped working. The legend says "satellites"
  and the honesty note says so. Named beat objects with a researched end
  of mission (Vanguard 1 went silent in 1964) dim from that date.
- **One page, chapters appended.** `/space` holds chapter 1 now and
  chapters 2 and 3 later. Every dot is keyed by its NORAD catalogue
  number from the start, and the renderer has two placement modes:
  spread along the real orbit shape (chapter 1) and computed from current
  orbital elements (chapter 2, later). It's a new engine beside the
  descent's, sharing its Earth textures and tokens, not changes to
  `core.js`.
- **Named objects' orbits** use the real height, shape and tilt, with an
  illustrative orientation, labelled as such. Historical element sets
  from Space-Track aren't used (account needed, republishing limited).
- **Which objects, as of when.** One SATCAT snapshot, dated on the page.
  Every Earth-orbiting object with a launch date is included, also those
  catalogued long after their launch (shown from the launch date, as the
  catalogue records it). All counts in the text come from the same
  snapshot, so the counter and the story always agree. The busiest
  moment (end of 2019) is about 24,000 objects; the performance budget is
  set for 30,000.

## Left to the builder (Claude's calls, stated)

- The page address (suggest `/space`) and its link from the homepage.
- Rendering approach (WebGL points with per-object orbit parameters, in
  the descent's style), performance budget, data packing.
- Exact beat list and wording (from research, reviewed by Freider).
- The small count chart and its placement.
