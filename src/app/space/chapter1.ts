// Chapter 1 of the space-age story (/space): from Sputnik 1 to the first
// Starlinks. One beat per moment; as a beat's text crosses the middle of
// the screen the story date moves to its date and the globe turns to its
// place. Counts in the text are written as {count:YYYY-MM-DD} (or
// {count:YYYY-MM-DD:satellites}, …:rocketBodies, …:debris) and filled in
// from the catalogue on the server, so the text and the counter agree.
// Every other fact comes from the research briefs in docs/space/research.

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
const VANDENBERG = { lat: 34.74, lon: -120.57 };
const ANDOYA = { lat: 69.29, lon: 16.02 };

const NSSDCA = (id: string) => `https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=${id}`;

export const CHAPTER1: Beat[] = [
  {
    id: "sputnik-1",
    date: "1957-10-04",
    kicker: "4 October 1957",
    title: "Two objects",
    body: [
      "At 19:28 UTC a modified R-7 missile lifted off from Tyuratam, a test range on the steppe of Soviet Kazakhstan. On top was a polished aluminium ball 58 centimetres across, weighing 83.6 kilograms, with four long antennas. The satellite was simple: two radio transmitters and their batteries.",
      "Its signal was a pulse, on and off three tenths of a second at a time, on frequencies an ordinary shortwave set could pick up. Radio amateurs recorded it and followed its path by how the pitch of the beeps changed as it passed.",
      "What people saw crossing the evening sky was something else. The rocket's core stage had reached orbit too, and it was far brighter than the sphere, which sat near the limit of what the eye can see. The catalogue of objects in orbit starts here, with {count:1957-10-04} entries. The rocket is number 1 and the satellite number 2.",
      "Five days later President Eisenhower told reporters that the satellite did not raise his apprehensions, “not one iota.” Much of his country did not share his calm. The batteries ran out after about three weeks, and Sputnik 1 went on circling in silence, once every 96 minutes, until it fell back into the atmosphere in the first days of 1958. Less than a month after it launched, a second satellite went up, and it was not empty.",
    ],
    focus: TYURATAM,
    highlight: [1, 2],
    sources: [
      { label: "NASA NSSDCA: Sputnik 1", url: NSSDCA("1957-001B") },
      { label: "R. D. Launius, Sputnik and the Origins of the Space Age (NASA History)", url: "https://www.nasa.gov/history/sputnik/sputorig.html" },
      { label: "The President's News Conference, 9 October 1957 (American Presidency Project)", url: "https://www.presidency.ucsb.edu/documents/the-presidents-news-conference-308" },
    ],
  },
  {
    id: "sputnik-2",
    date: "1957-11-03",
    kicker: "3 November 1957",
    title: "Laika",
    body: [
      "Less than a month later another R-7 carried Sputnik 2: a 508-kilogram cone with instruments for the Sun's ultraviolet light, X-rays and cosmic rays, and a sealed cabin holding a dog. Laika was a stray from Moscow. A television camera sent pictures of her back to the ground, ten frames a second.",
      "There was no way to bring her back. Soviet statements at the time implied she lived for days. Russian sources from 1999 and 2002 said the cabin overheated and that she died within hours of launch.",
      "The R-7 had been built to carry nuclear warheads, and it could now put half a tonne into orbit. That deepened American fears about Soviet missiles. Sputnik 2 never separated from the rocket's core stage, so the catalogue lists them as one object, number 3. It came down on 14 April 1958, after 162 days.",
    ],
    focus: TYURATAM,
    highlight: [3],
    sources: [
      { label: "NASA NSSDCA: Sputnik 2", url: NSSDCA("1957-002A") },
      { label: "J. Harford, Korolev's Triple Play (NASA History)", url: "https://www.nasa.gov/history/sputnik/harford.html" },
      { label: "Royal Museums Greenwich: What was the first animal in space?", url: "https://www.rmg.co.uk/stories/topics/what-was-first-animal-space" },
    ],
  },
  {
    id: "explorer-1",
    date: "1958-02-01",
    kicker: "1 February 1958",
    title: "The counter that went quiet",
    body: [
      "America's first satellite went up late in the evening of 31 January in Florida, which was already 1 February by the clock the catalogue keeps. Explorer 1 rode a Jupiter-C, an Army Redstone missile with three stages of small solid rockets on top, built by Wernher von Braun's team in Huntsville. The Jet Propulsion Laboratory built the satellite: a slim tube of about 14 kilograms, still attached to its last rocket stage.",
      "When it reached orbit there were {count:1958-02-01} objects up there, Sputnik 2 and Explorer 1 itself. Sputnik 1 and the first rocket stage had already fallen.",
      "Its main instrument was a Geiger counter from James Van Allen's group at the University of Iowa, meant to count cosmic rays. At times it read zero. Van Allen's team proposed that the tube was being swamped, not starved: radiation far stronger than anyone expected was saturating it. Explorer 3 carried a tape recorder in March that could hold a whole orbit of readings, and it confirmed the idea.",
      "The belt of charged particles they had found, held in place by Earth's magnetic field, was announced on 1 May 1958. A second, outer belt was found later that year. Electronics and crews that pass through them need shielding, and that still shapes where satellites are put.",
    ],
    focus: CANAVERAL,
    highlight: [4],
    sources: [
      { label: "NASA NSSDCA: Explorer 1", url: NSSDCA("1958-001A") },
      { label: "J. Uri, 60 Years Ago: Explorer 1 Becomes America's First Satellite (NASA)", url: "https://www.nasa.gov/feature/60-years-ago-explorer-1-becomes-america-s-first-satellite" },
      { label: "D. A. Gurnett, The Life and Accomplishments of James A. Van Allen (IEEE, 2007)", url: "https://space.physics.uiowa.edu/~dag/publications/2007_TheLifeAndAccomplishmentsOfJamesAVanAllen_IEEE.pdf" },
    ],
  },
  {
    id: "vanguard-1",
    date: "1958-03-17",
    kicker: "17 March 1958",
    title: "The oldest one up there",
    body: [
      "The rocket rose about four feet.",
      "The Navy's Vanguard was supposed to be first. On 6 December 1957, on live television, it lost thrust and exploded. Newspapers called it Flopnik.",
      "On 17 March 1958 a Vanguard worked. Its satellite was a sphere about 16 centimetres across, weighing 1.46 kilograms, with six thin antennas. One of its two radios ran on batteries and soon went quiet. The other ran on six solar cells, each about five centimetres square, and kept transmitting until May 1964. It was the first satellite powered by sunlight, and nearly every one since has been.",
      "Its orbit was watched closely enough to show that the Earth is very slightly pear-shaped, a little fuller in the south than in the north.",
      "Sputnik 1, Sputnik 2 and Explorer 1 have all come down. Vanguard 1 has not. It is the oldest object made by people that is still in orbit, and its third stage, launched with it, is the oldest rocket body. Its orbit is expected to last about 240 years.",
    ],
    focus: CANAVERAL,
    highlight: [5, 16, 1576],
    sources: [
      { label: "NASA NSSDCA: Vanguard 1", url: NSSDCA("1958-002B") },
      { label: "J. Uri, 60 Years Ago: Vanguard Fails to Reach Orbit (NASA)", url: "https://www.nasa.gov/history/60-years-ago-vanguard-fails-to-reach-orbit/" },
      { label: "C. M. Green and M. Lomask, Vanguard: A History (NASA SP-4202)", url: "https://history.nasa.gov/SP-4202/chap11.html" },
    ],
  },
  {
    id: "tiros-1",
    date: "1960-04-01",
    kicker: "1 April 1960",
    title: "Clouds",
    body: [
      "By 1960 the question was no longer whether something could be put in orbit, but what it could do there. TIROS-1 was a drum about a metre across, covered in solar cells, with two small television cameras looking down. It was one of {count:1960-04-01} objects in orbit on the day it launched.",
      "Its first picture, taken about two hours after launch, showed an almost featureless disc of cloud.",
      "Over 78 days it sent down some 20,000 images. NASA counts about 23,000; NOAA counts 19,389 usable ones. For the first time forecasters could see weather systems across whole oceans, where there were no weather stations and few ships to report. The early pictures showed the spiral cloud bands around large storms.",
      "TIROS-1 stopped working in June 1960 and is still in orbit. The weather satellites forecasters use today came out of it.",
    ],
    focus: CANAVERAL,
    highlight: [29, 28, 115],
    sources: [
      { label: "NASA NSSDCA: TIROS 1", url: NSSDCA("1960-002B") },
      { label: "ECMWF: The first TV picture from space? (2010)", url: "https://www.ecmwf.int/node/25696" },
      { label: "NOAA NESDIS: Celebrating 60 Years of the World's First Weather Satellite", url: "https://www.nesdis.noaa.gov/news/celebrating-60-years-of-the-worlds-first-weather-satellite" },
    ],
  },
  {
    id: "echo-1",
    date: "1960-08-12",
    kicker: "12 August 1960",
    title: "A balloon you could see",
    body: [
      "Echo 1 was a balloon 30 metres across, made of plastic film 0.0127 millimetres thick with a coat of aluminium. It went up folded and inflated in orbit. It carried no relay: it was a mirror for radio.",
      "On its first orbit a recorded message from Eisenhower was sent from Goldstone in California, reflected off the balloon and received at Bell Labs in New Jersey. “The satellite balloon which has reflected these words may be used freely by any nation for similar experiments in its own interests,” it said. Telephone calls across the continent followed, and then signals to France.",
      "At that size and about 1,600 kilometres up, Echo was bright and steady, and NASA published times and places to look for it. For many people it was the first satellite they knowingly saw. When it was about to fall, in 1968, a girl in Canada sent NASA a poem with the line “Thanks for making me look up.”",
      "The balloon came down on 24 May 1968. Its rocket stage and three small pieces of debris are still up there, close to the height Echo itself flew at. Rocket stages left in orbit do not always stay quiet. Ten months after Echo's launch, one did not.",
    ],
    focus: CANAVERAL,
    highlight: [49, 50, 51, 52, 53],
    sources: [
      { label: "NASA NSSDCA: Echo 1", url: NSSDCA("1960-009A") },
      { label: "J. R. Hansen, Spaceflight Revolution, ch. 6 (NASA SP-4308)", url: "https://www.nasa.gov/wp-content/uploads/2023/04/sp-4308.pdf" },
      { label: "Eisenhower, Message Recorded for Transmission via Echo I (American Presidency Project)", url: "https://www.presidency.ucsb.edu/node/235169" },
    ],
  },
  {
    id: "first-break-up",
    date: "1961-06-29",
    kicker: "29 June 1961",
    title: "The first explosion",
    body: [
      "A Thor-Ablestar rocket from Cape Canaveral put three satellites into orbit, among them the navigation satellite Transit 4A. About 77 minutes later its spent upper stage blew apart, about 990 kilometres up. Some 100 kilograms of propellant were still in its tanks. It was the first Ablestar flight that hadn't vented them.",
      "A tracking camera in New Mexico photographed it happen. It was the first known break-up of anything in orbit. The day before, there were {count:1961-06-28} objects in orbit. By the end of the day there were {count:1961-06-29}.",
      "The catalogue holds 316 pieces of that stage today, and more than half are still in orbit. Fragments from it are still being found and added, decades later. Seventeen years later two NASA scientists would write down where such explosions could lead.",
      "The investigators recommended that spent stages vent their leftover fuel. It became one of the basic rules of keeping orbit clean, long before anyone wrote debris guidelines.",
    ],
    focus: CANAVERAL,
    highlight: [116, 117, 118],
    sources: [
      { label: "NASA ODPO, History of On-orbit Satellite Fragmentations, 16th ed. (2022)", url: "https://orbitaldebris.jsc.nasa.gov/library/HOOSF_16e.pdf" },
      { label: "NASA technical report on early break-ups (1985)", url: "https://ntrs.nasa.gov/citations/19850012880" },
    ],
  },
  {
    id: "starfish-prime",
    date: "1962-07-09",
    kicker: "9 July 1962",
    title: "A bomb above the atmosphere",
    body: [
      "The United States detonated a 1.4-megaton nuclear warhead about 400 kilometres above Johnston Island in the Pacific. The test was called Starfish Prime.",
      "Its electrons were caught by Earth's magnetic field, the way Van Allen's particles were, and made the inner radiation belt far more intense than it had been. Satellites flying through it began to fail. Ariel 1, Britain's first satellite, launched that April, lost power from damaged solar cells in August. Transit 4B and TRAAC failed within weeks. A NASA review counts seven satellites lost within months, mostly through damage to their solar cells.",
      "The Partial Test Ban Treaty of 1963 ended nuclear tests in space.",
      "The day after Starfish Prime, a satellite built to carry live television was launched into the belt it had filled.",
    ],
    focus: { lat: 16.73, lon: -169.53 },
    highlight: [285, 202, 205],
    sources: [
      { label: "W. G. Stassinopoulos, The STARFISH Exo-atmospheric, High-altitude Nuclear Weapons Test (NASA GSFC, 2015)", url: "https://ntrs.nasa.gov/citations/20150018896" },
      { label: "T. I. Gombosi et al., Anthropogenic Space Weather (Space Science Reviews, 2017)", url: "https://arxiv.org/abs/1611.03390" },
    ],
  },
  {
    id: "telstar",
    date: "1962-07-10",
    kicker: "10 July 1962",
    title: "Live across the Atlantic",
    body: [
      "The next day Telstar 1 went up. Bell Labs built it for AT&T, which paid NASA for the launch. Unlike Echo, it received signals, amplified them and sent them back.",
      "Test pictures went from Andover in Maine to Pleumeur-Bodou in Brittany the same week. On 23 July the first public live programme crossed the Atlantic, and the Smithsonian estimates that several hundred million people in 16 countries watched. The feed to Europe joined partway through a press conference by President Kennedy, after he had finished talking about Telstar.",
      "Telstar flew in a low, stretched orbit and was in view of both sides of the ocean for only about 20 minutes of each two-and-a-half-hour circuit, so programmes were scheduled around its passes. In November its command system failed from radiation damage, after a launch into the belt Starfish had just filled. Engineers revived it, and in February 1963 it went silent for good.",
    ],
    focus: { lat: 46, lon: -35 },
    highlight: [340],
    sources: [
      { label: "Smithsonian NASM: Telstar and the World of 1962", url: "https://airandspace.si.edu/stories/editorial/telstar-and-world-1962" },
      { label: "The President's News Conference, 23 July 1962 (American Presidency Project)", url: "https://www.presidency.ucsb.edu/documents/the-presidents-news-conference-180" },
      { label: "IEEE Milestone: First Transatlantic Transmission of a Television Signal via Satellite", url: "https://ethw.org/Milestones:First_Transatlantic_Transmission_of_a_Television_Signal_via_Satellite,_1962" },
    ],
  },
  {
    id: "ferdinand-1",
    date: "1962-08-18",
    kicker: "18 August 1962",
    title: "Ferdinand",
    body: [
      "At 07:09 on a Saturday morning in August, a rocket left Oksebåsen on Andøya, about six kilometres from Andenes in Vesterålen. Ferdinand 1 was a two-stage American Nike-Cajun. It climbed to about 100 kilometres, measured the lower ionosphere, and came back down.",
      "Andøya lies in the auroral zone. When the aurora disturbed the ionosphere, the long-distance radio that northern Norway depended on failed, and the point of the programme was to understand why. The rocket was American, the payload Danish and Norwegian, and the agreement three-way, between Norway's research council for science and technology, the Danish Ionospheric Laboratory and NASA. The rocket was named after the bull in the children's book who would rather smell flowers than fight, partly to make clear that this was peaceful research.",
      "Ferdinand never reached orbit, so it has no number in the catalogue and no dot on this globe. The range it opened is now Andøya Space. Eivind Thrane's history of the range says that with it Norway “had entered the space age.” More than thirty years later, a rocket from the same range would turn up on a Russian radar screen.",
    ],
    focus: ANDOYA,
    sources: [
      { label: "E. V. Thrane, The history of Andøya Rocket Range (Hist. Geo Space Sci., 2018)", url: "https://hgss.copernicus.org/articles/9/141/2018/" },
      { label: "Store norske leksikon: Ferdinand – forskningsraketter", url: "https://snl.no/Ferdinand_-_forskningsraketter" },
      { label: "Andøya Space: 60 years in space", url: "https://andoyaspace.no/who-we-are/history/60-years-in-space/" },
    ],
  },
  {
    id: "syncom-2",
    date: "1963-07-26",
    kicker: "26 July 1963",
    title: "Once a day",
    body: [
      "In October 1945 the magazine *Wireless World* printed an article by Arthur C. Clarke. At 42,000 kilometres from the Earth's centre, he showed, an orbit takes a day. Something there, above the equator, would keep pace with the turning planet and seem to hang still in the sky. Three such relay stations could cover the world.",
      "Getting close took eighteen years. Syncom 1 went silent in February 1963 as its motor fired. Syncom 2, launched on 26 July 1963, worked, and went round once a day. But its orbit was tilted 33 degrees to the equator, so from the ground it traced a figure of eight, north and south, instead of staying put.",
      "It could carry one two-way telephone call. On 23 August President Kennedy used it to call Nigeria's Prime Minister, Abubakar Tafawa Balewa, who was on a ship in Lagos harbour. “I think that what we are doing today shows what can be done through the peaceful use of space,” Kennedy said.",
    ],
    focus: { lat: 0, lon: -55 },
    highlight: [553, 634],
    sources: [
      { label: "A. C. Clarke, Extra-Terrestrial Relays (Wireless World, October 1945)", url: "https://lakdiva.org.lk/clarke/1945ww/" },
      { label: "NASA NSSDCA: Syncom 2", url: NSSDCA("1963-031A") },
      { label: "Kennedy, conversation with the Prime Minister of Nigeria via Syncom (American Presidency Project)", url: "https://www.presidency.ucsb.edu/documents/conversation-with-the-prime-minister-nigeria-means-the-syncom-communications-satellite" },
    ],
  },
  {
    id: "syncom-3",
    date: "1964-08-19",
    kicker: "19 August 1964",
    title: "Standing still",
    body: [
      "Syncom 3 was launched on 19 August 1964 and by 23 September had been steered into an orbit tilted by a tenth of a degree, over the Pacific at 180 degrees longitude. Seen from the ground it no longer moved. It was the first geostationary satellite: an antenna could be pointed at it once and left there.",
      "In October it carried live television of the Tokyo Olympics from Japan to the United States, the first live Olympic broadcast across an ocean.",
      "Most satellite television still comes from this orbit. On the globe, the dots that ring the Earth at this height are the ones that don't move while everything below them races. Syncom 3 was switched off in 1969. It is still up there, and its orbit has slowly tipped to a tilt of seven degrees.",
    ],
    focus: { lat: 0, lon: 180 },
    highlight: [858],
    sources: [
      { label: "NASA NSSDCA: Syncom 3", url: NSSDCA("1964-047A") },
      { label: "Johnson, statement on the inauguration of television via satellite between Japan and the US (American Presidency Project)", url: "https://www.presidency.ucsb.edu/documents/recorded-statement-marking-the-inauguration-television-communication-satellite-between-the" },
    ],
  },
  {
    id: "early-bird",
    date: "1965-04-06",
    kicker: "6 April 1965",
    title: "Open for business",
    body: [
      "Early Bird was a Syncom put to work. Hughes Aircraft built it for the new Communications Satellite Corporation, and it was parked over the Atlantic. It could carry 240 telephone calls or one black-and-white television channel, not both at once.",
      "Commercial service began on 28 June 1965. President Johnson spoke through it to officials in six European countries and heard back from Harold Wilson and Ludwig Erhard, among others. “For the first time a manmade satellite of earth is being put into commercial service as a means of communication between continents,” he said.",
      "Unlike Telstar, it never set. Calls and television across the North Atlantic could be booked at any hour. It was retired in January 1969, then switched back on that summer when a newer Intelsat satellite over the Atlantic failed, the same summer as Apollo 11.",
    ],
    focus: { lat: 0, lon: -30 },
    highlight: [1317, 1318],
    sources: [
      { label: "ESA: 28 June (on this day)", url: "https://www.esa.int/Science_Exploration/Space_Science/28_June" },
      { label: "Johnson, remarks marking the first commercial communication satellite service (American Presidency Project)", url: "https://www.presidency.ucsb.edu/documents/remarks-ceremony-marking-the-first-commercial-communication-satellite-service" },
    ],
  },
  {
    id: "molniya",
    date: "1965-04-23",
    kicker: "23 April 1965",
    title: "An orbit for the north",
    body: [
      "A satellite over the equator sits lower in the sky the further north you are. Seen from Moscow, a geostationary satellite due south stands about 26 degrees above the horizon. From Andenes it is about 12 degrees, and from Longyearbyen about 3, low enough for any hill to block it.",
      "Most of the Soviet Union lay far north, and its launch site at Tyuratam was at 46 degrees north, far from the equator. Molniya 1-1, launched on 23 April 1965, took a different route. Its orbit is long and narrow: it climbs to about 40,000 kilometres over the northern hemisphere and swings round the south much lower, between a few hundred and about 2,000 kilometres up. A satellite moves slowly at the top of such an orbit, so it spends most of each twelve-hour circuit high over the north. Two circuits a day, several satellites spaced out, and there is always one in view.",
      "The tilt of 63.4 degrees keeps the high point of the orbit from drifting. From 1967 Molniya satellites fed the Orbita network, which brought Moscow television to Siberia and the Far East. The orbit carries the satellites' name; *molniya* is Russian for lightning.",
      "Norway reached the same answer for the same reason. Space Norway's two Arctic broadband satellites, launched in 2024, loop up to about 44,000 kilometres above the Arctic.",
    ],
    focus: { lat: 62, lon: 90 },
    highlight: [1324, 898],
    sources: [
      { label: "NASA Earth Observatory: Catalog of Earth Satellite Orbits", url: "https://science.nasa.gov/earth/earth-observatory/catalog-of-earth-satellite-orbits" },
      { label: "A. Zak, Soviet/Russian communications satellites (RussianSpaceWeb)", url: "https://www.russianspaceweb.com/spacecraft_comsats.html" },
      { label: "eoPortal: ASBM", url: "https://www.eoportal.org/satellite-missions/asbm" },
    ],
  },
  {
    id: "break-ups",
    date: "1965-10-15",
    kicker: "15 October 1965",
    title: "Pieces",
    body: [
      "NASA counts 22 known break-ups in orbit between 1961 and 1969, the first being the Ablestar stage that blew up in June 1961. Nearly all were explosions or deliberate destruction. The largest happened on this day, when a Titan transtage that had carried the satellite OV2-1 broke into 473 catalogued fragments.",
      "Some were deliberate. The Soviet Union destroyed Kosmos 50 on purpose in November 1964, and in 1968 it blew up Kosmos 249 and Kosmos 252 in tests of a weapon for destroying satellites.",
      "They show on the globe as the faint grey dust that builds up between the bright dots. At the end of the decade there were {count:1969-12-31} objects in orbit, and {count:1969-12-31:debris} of them were debris.",
    ],
    focus: CANAVERAL,
    sources: [{ label: "NASA ODPO, History of On-orbit Satellite Fragmentations, 16th ed. (2022)", url: "https://orbitaldebris.jsc.nasa.gov/library/HOOSF_16e.pdf" }],
  },
  {
    id: "apollo-11",
    date: "1969-07-16",
    kicker: "16 July 1969",
    title: "Visitors",
    body: [
      "Yuri Gagarin made one orbit on 12 April 1961, in 108 minutes; the catalogue lists his Vostok 1 as launched and fallen on the same day. The Mercury, Gemini, Vostok, Voskhod, Soyuz and Apollo flights of the 1960s were all visits.",
      "Apollo 11 left on 16 July 1969. Most of its Saturn V never reached orbit: the first two stages fell into the Atlantic. The third stage sent the crew towards the Moon and went on into orbit around the Sun. Eagle's ascent stage was left in orbit around the Moon; where it ended up is unknown. None of it is on this globe.",
      "The pictures of the landing reached other countries through Intelsat satellites.",
    ],
    focus: CANAVERAL,
    sources: [
      { label: "NASA NSSDCA: Apollo 11", url: "https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo11info.html" },
      { label: "NASA NSSDCA: Impact sites of the Apollo LM ascent and S-IVB stages", url: "https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_impact.html" },
      { label: "NASA: April 1961, first human entered space", url: "https://www.nasa.gov/image-article/april-1961-first-human-entered-space/" },
    ],
  },
  {
    id: "landsat-1",
    date: "1972-07-23",
    kicker: "23 July 1972",
    title: "Looking down on purpose",
    body: [
      "ERTS-1, launched from Vandenberg in California and later renamed Landsat 1, was the first satellite built to map the land, again and again. It circled about 900 kilometres up, over the poles, and passed over each place at the same time of day every 18 days.",
      "Its main instrument, three television cameras, caused an electrical surge and was shut down within weeks. The second instrument, a scanner in four colour bands, turned out to be the better instrument. Its first image, two days after launch, showed Dallas and Fort Worth.",
      "Landsat 1 was designed to last a year and worked for nearly six. Landsats 2 to 9 followed, apart from Landsat 6, which failed at launch. The record they keep has run without a break since 1972. Deforestation, cities spreading and glaciers retreating are measured against it. When the archive was made free in 2008, use went from about 25,000 scenes in fiscal 2001, its best year, to more than a million downloads in fiscal 2009.",
      "Landsat 1 was switched off in January 1978. It is still in orbit.",
    ],
    focus: { lat: 32.8, lon: -96.8 },
    highlight: [6126, 6127],
    sources: [
      { label: "USGS: Landsat 1", url: "https://www.usgs.gov/landsat-missions/landsat-1" },
      { label: "NASA NSSDCA: Landsat 1", url: NSSDCA("1972-058A") },
      { label: "USGS: Opening the Landsat archive helped realize its true value", url: "https://www.usgs.gov/centers/eros/news/opening-landsat-archive-helped-realize-its-true-value" },
    ],
  },
  {
    id: "navstar-1",
    date: "1978-02-22",
    kicker: "22 February 1978",
    title: "Where am I",
    body: [
      "An Atlas rocket from Vandenberg launched Navstar 1, the first of eleven test satellites for the US Air Force's Global Positioning System. It circles about 20,000 kilometres up, twice a day. Each GPS satellite carries atomic clocks and broadcasts the time; a receiver that hears several of them works out where it is from the differences.",
      "After the Soviet Union shot down Korean Air Lines Flight 007, which had strayed into its airspace in September 1983, the White House announced that civilian aircraft would be able to use GPS once it was running. It took until 1995 for the full system to be declared ready.",
      "Civilians could use it, but the signal they got carried a deliberate error. At about 04:05 UTC on 2 May 2000 that error was switched off. At one measuring station the 95 per cent error radius fell from 45 metres on 1 May to 6.3 metres on 3 May. That is the GPS in phones and cars.",
    ],
    focus: VANDENBERG,
    highlight: [10684, 10893, 11054, 11141],
    sources: [
      { label: "Clinton, statement on the decision to stop degrading GPS signals, 1 May 2000 (American Presidency Project)", url: "https://www.presidency.ucsb.edu/documents/statement-the-decision-stop-degrading-global-positioning-system-signals" },
      { label: "GPS.gov archive: Selective Availability, first-week data", url: "https://archive.gps.gov/systems/gps/modernization/sa/data/" },
      { label: "Reagan Library: GPS finding aid", url: "https://www.reaganlibrary.gov/public/archives/textual/topics/globpost.pdf" },
    ],
  },
  {
    id: "kessler",
    date: "1978-06-01",
    kicker: "June 1978",
    title: "A warning",
    body: [
      "Two NASA scientists in Houston, Donald Kessler and Burton Cour-Palais, published a paper with a dry title: “Collision frequency of artificial satellites: The creation of a debris belt.”",
      "The argument was short. The more objects there are in orbit, the likelier they are to hit each other. Each collision makes fragments, and each fragment raises the odds of the next collision. The process could feed itself, and a belt of debris would form around the Earth. Small, untracked fragments from explosions, of the kind the Ablestar had left in 1961, would bring that date forward. They thought it “could begin to form within this century” and become “a significant problem during the next century.” When they wrote it, the catalogue held {count:1978-06-01} objects in orbit, {count:1978-06-01:debris} of them debris.",
      "By Kessler's own account John Gabbard of NORAD gave it the name it is known by, the Kessler syndrome, while talking to a reporter. Kessler later had to explain what it didn't mean: “It was never intended to mean that the cascading would occur over a period of time as short as days or months.”",
    ],
    focus: { lat: 29.56, lon: -95.09 },
    sources: [
      { label: "Kessler and Cour-Palais, Collision frequency of artificial satellites (JGR, 1978)", url: "https://doi.org/10.1029/JA083iA06p02637" },
      { label: "NASA NTRS record and abstract", url: "https://ntrs.nasa.gov/citations/19780057167" },
      { label: "D. J. Kessler, The Kessler Syndrome (2009)", url: "https://aquarid.physics.uwo.ca/kessler/KesSym.html" },
    ],
  },
  {
    id: "sts-1",
    date: "1981-04-12",
    kicker: "12 April 1981",
    title: "A ferry and a house",
    body: [
      "Twenty years to the day after Gagarin, Columbia launched from Florida with John Young and Robert Crippen on board. It flew 37 orbits in a little over two days and landed at Edwards Air Force Base in California.",
      "The shuttle was meant to make getting to orbit routine and cheap. It never flew as often, or as cheaply, as had been promised. Until the Challenger accident in 1986 it also carried commercial satellites: on its fifth flight, in November 1982, Columbia released two communications satellites from its payload bay.",
      "In February 1986 the Soviet Union launched the core of Mir. Its first crew arrived in March, and over the next 15 years it was enlarged and made long stays in orbit routine. It came down on 23 March 2001.",
    ],
    focus: CANAVERAL,
    highlight: [12399, 13651, 13652, 16609],
    sources: [
      { label: "NASA: STS-1", url: "https://www.nasa.gov/mission/sts-1/" },
      { label: "D. S. F. Portree, Mir Hardware Heritage (NASA RP-1357)", url: "https://ntrs.nasa.gov/citations/19950016829" },
    ],
  },
  {
    id: "astra-1a",
    date: "1988-12-11",
    kicker: "11 December 1988",
    title: "Dishes on balconies",
    body: [
      "The ring above the equator was filling. Counting only satellites and rocket stages that still go round once a day, at least 104 were in or near that orbit at the end of 1980, and at least 240 at the end of 1989. Places on it became something countries negotiated over. At conferences in 1985 and 1988 the International Telecommunication Union drew up plans on the principle that the orbit is a limited natural resource, to which every country should have fair access, including those that couldn't yet use it.",
      "Astra 1A, launched from Kourou in French Guiana, began broadcasting in February 1989 with Sky's four channels, to dishes small enough for the balconies of Europe.",
      "When a geostationary satellite is finished, it is pushed a few hundred kilometres higher, out of the way, into what is called a graveyard orbit. Astra 1A is there now.",
    ],
    focus: { lat: 48, lon: 10 },
    highlight: [19688, 13878, 858],
    sources: [
      { label: "ITU History Portal: WARC ORB-85/88", url: "https://www.itu.int/en/history/Pages/RadioConferences.aspx?conf=4.119" },
      { label: "NASA JPL: Astra", url: "https://space.jpl.nasa.gov/msl/Programs/astra.html" },
      { label: "ITU-R Recommendation S.1003 (1993)", url: "https://www.itu.int/dms_pubrec/itu-r/rec/s/R-REC-S.1003-0-199304-S!!PDF-F.pdf" },
    ],
  },
  {
    id: "hubble",
    date: "1990-04-24",
    kicker: "24 April 1990",
    title: "Two microns",
    body: [
      "Discovery carried the Hubble Space Telescope into orbit and released it the next day. Within weeks its first images came back blurred. The main mirror had been ground very precisely to the wrong shape, two microns too flat at the edge, because a lens in the test instrument used while grinding it sat 1.3 millimetres out of place.",
      "In December 1993 astronauts fitted corrective optics and a new camera. One of the solar panels they threw away on that visit stayed in orbit until October 1998.",
    ],
    focus: CANAVERAL,
    highlight: [20580, 22920],
    sources: [
      { label: "NASA: STS-31", url: "https://www.nasa.gov/mission/sts-31/" },
      { label: "ESA/Hubble: Servicing Mission 1", url: "https://esahubble.org/about/history/servicing_mission_1/" },
      { label: "NASA NTRS: The Hubble Space Telescope optical systems failure report (1990)", url: "https://ntrs.nasa.gov/citations/19910003124" },
    ],
  },
  {
    id: "thor",
    date: "1990-08-18",
    kicker: "18 August 1990",
    title: "A second-hand satellite",
    body: [
      "Marcopolo 2 was launched from Cape Canaveral to beam British satellite television for BSB. When BSB merged with Sky, it wasn't needed. In 1992 Televerket, the Norwegian state telecom company that became Telenor, bought it in orbit and named it Thor. From about 1 degree west it broadcast television and radio to northern Europe for eleven years.",
      "Thor 2 followed in May 1997 and Thor 3 in June 1998, the first satellite Telenor controlled itself. Canal Digital's Nordic satellite television came from them, and NRK's channels still come from almost the same spot, 0.8 degrees west.",
      "The catalogue lists Thor 1 as Norwegian. All three are still up there, parked a little above the geostationary ring.",
    ],
    focus: { lat: 60, lon: 5 },
    highlight: [20762, 24808, 25358],
    sources: [
      { label: "Romdirektoratet: Satellittkommunikasjon i Norge", url: "https://romdirektoratet.no/laer-om-romvirksomhet/satellittkommunikasjon-i-norge" },
      { label: "Store norske leksikon: Thor – satellitter", url: "https://snl.no/Thor_-_satellitter" },
      { label: "Telenor: Successful launch of Telenor's new satellite (1998)", url: "https://www.telenor.com/media/newsroom/archive/successful-launch-of-telenors-new-satellite" },
    ],
  },
  {
    id: "black-brant",
    date: "1995-01-25",
    kicker: "25 January 1995",
    title: "The black suitcase",
    body: [
      "More than thirty years after Ferdinand, the range on Andøya was still sending up science rockets, and the notice for this one had gone out well ahead. On 21 December 1994 Norway's foreign ministry sent a note to every foreign embassy in Oslo. Scientific rockets would be launched from Andøya between 15 January and 10 February, between 05:00 and 12:00, with impact zones out towards Svalbard. One of them would be a four-stage Black Brant XII.",
      "The rocket never reached orbit and isn't on the globe. By that morning there were {count:1995-01-25} objects in orbit.",
      "What happened at Olenegorsk is where the accounts part. In Peter Pry's 1999 book *War Scare*, the alert went up the chain to President Boris Yeltsin. The next day Yeltsin told reporters he had used his black suitcase for the first time.",
      "Other readers are less sure. The MIT arms-control analyst Geoffrey Forden argued that Russia's early-warning satellites would have shown there was no mass attack. A 2026 review in the *Bulletin of the Atomic Scientists* asks whether Yeltsin's remark was about the rocket or about politics. Why the note may not have reached the radar crews is unclear too.",
    ],
    focus: ANDOYA,
    sources: [
      { label: "Norwegian foreign ministry notification (published by P. Podvig, 2005)", url: "https://russianforces.org/blog/2005/08/norway_black_brant_letter.shtml" },
      { label: "NRK: Verden har aldri vært nærmere atomkrig (2012)", url: "https://www.nrk.no/nyheter/distrikt/nordland/1.8005229" },
      { label: "Bulletin of the Atomic Scientists (2026)", url: "https://thebulletin.org/?p=130838" },
      { label: "NASA MSFC: SCIFER", url: "https://spdf.gsfc.nasa.gov/pub/data/de/de1/documents/websites/spacephysics.msfc.nasa.gov/projects/scifer.shtml" },
    ],
  },
  {
    id: "iridium",
    date: "1997-05-05",
    kicker: "5 May 1997",
    title: "A phone that works anywhere",
    body: [
      "The first five Iridium satellites launched from Vandenberg. By 2002, 95 had gone up. The working system was 66 of them in near-polar orbits about 780 kilometres high, so that a handheld phone could reach anyone from anywhere, the poles and the open sea included.",
      "Vice President Al Gore made a ceremonial call on 30 October 1998, and service opened on 1 November. The phones were expensive and few people bought them. On 13 August 1999 Iridium filed for bankruptcy, nine months after opening. The satellites were to be brought down; instead, in late 2000, a new company bought the whole system for 25 million dollars. It went on to serve ships, expeditions, armed forces and the Arctic.",
      "Globalstar went bankrupt in 2002. Teledesic, which had planned hundreds of satellites for internet from orbit, launched one test satellite and stopped work that October. For more than a decade investors kept away from large constellations in low orbit.",
      "Each of the first Iridiums had three polished antennas the size of a door. When one caught the sun, it flashed brighter than Venus, at times that could be predicted, and people went out to watch. The last working one of the original satellites was brought down in December 2019; about 30 dead ones are still up there. Iridium 33, launched in September 1997, was still working in 2009, when a dead Russian satellite crossed its path.",
    ],
    focus: { lat: 70, lon: -120 },
    highlight: [24796, 24795, 24793, 24946, 25162, 25163, 25164, 25165, 25234],
    sources: [
      { label: "White House release on the Iridium call, 30 October 1998", url: "https://govinfo.library.unt.edu/npr/library/news/103098.html" },
      { label: "Seattle Times: Teledesic suspends work on satellites (2002)", url: "https://archive.seattletimes.com/archive/20021001/teledesic01/teledesic-suspends-work-on-satellites" },
      { label: "Heavens-Above: Iridium flares", url: "https://www.heavens-above.com/IridiumDemise.aspx" },
      { label: "UNOOSA: Iridium deorbit case study", url: "https://www.unoosa.org/documents/pdf/PromotingSpaceSustainability/PresentationsCaseStudies/CaseStudies/Iridium_Case_Study_Report.pdf" },
    ],
  },
  {
    id: "iss",
    date: "1998-11-20",
    kicker: "20 November 1998",
    title: "Number 25544",
    body: [
      "A Proton rocket from Baikonur launched Zarya, a Russian-built module with power, engines and radios. Two weeks later the shuttle Endeavour brought up Unity, built in the United States, and the crew joined the two with the shuttle's robot arm. They had never been fitted together on the ground. In NASA's words: “Former adversaries on Earth were now working together to build the largest laboratory in space.”",
      "The station stood empty for almost two years, waiting for the Russian service module, Zvezda. On 2 November 2000 the first crew docked: William Shepherd, Yuri Gidzenko and Sergei Krikalev. Someone has been on board ever since.",
      "Assembly took 13 years. The station now weighs about 420 tonnes and spans 109 metres. In the catalogue it is still one object, number 25544, the number Zarya was given in 1998; later modules such as Unity and Zvezda are listed as docked to it. From Norway it is easy to see, the brightest satellite in the night sky.",
    ],
    focus: TYURATAM,
    highlight: [25544],
    sources: [
      { label: "NASA History: 20 Years Ago, Space Station Construction Begins", url: "https://www.nasa.gov/history/20-years-ago-space-station-construction-begins/" },
      { label: "NASA: Space Station Facts and Figures", url: "https://www.nasa.gov/international-space-station/space-station-facts-and-figures/" },
    ],
  },
  {
    id: "cubesats",
    date: "2003-06-30",
    kicker: "30 June 2003",
    title: "Ten centimetres",
    body: [
      "In 1999 Jordi Puig-Suari at Cal Poly and Bob Twiggs at Stanford proposed a standard for small satellites: a cube ten centimetres on each side, weighing little more than a kilogram, that a university could build in the course of a degree and that could ride on any rocket carrying a standard spring-loaded box for it.",
      "On 30 June 2003 a Rockot from Plesetsk, a converted Soviet missile, carried the first six. Two were never heard from. One, XI-IV from the University of Tokyo, was still reported working in 2020. All six are still in orbit, about 800 kilometres up.",
      "Norwegian students were early. nCube was built at NTNU, the University of Oslo, Narvik University College and the agricultural university at Ås, to listen from orbit for the radio messages ships send about where they are, and to test tracking reindeer wearing the same kind of transmitter. nCube-2 reached orbit in October 2005 and was never heard from. nCube-1 was lost when its rocket failed in July 2006.",
    ],
    focus: { lat: 62.93, lon: 40.58 },
    highlight: [27848, 27844, 27846, 27842, 27847, 27845, 28897],
    sources: [
      { label: "NASA, CubeSat 101 (2017)", url: "https://www.nasa.gov/wp-content/uploads/2017/03/nasa_csli_cubesat_101_508.pdf" },
      { label: "eoPortal: CubeSat Launch 1", url: "https://www.eoportal.org/satellite-missions/cubesat-launch-1" },
      { label: "Store norske leksikon: Norske satellittar", url: "https://snl.no/Norske_satellittar" },
      { label: "ESA: Educational CubeSats deployed from SSETI Express (2005)", url: "https://www.esa.int/Education/SSETI_Express/Educational_CubeSats_deployed_from_SSETI_Express2" },
    ],
  },
  {
    id: "fengyun-1c",
    date: "2007-01-11",
    kicker: "11 January 2007",
    title: "Three thousand catalogued pieces",
    body: [
      "At about 22:26 UTC a missile launched from China struck Fengyun-1C, a retired Chinese weather satellite of about 960 kilograms, at about 860 kilometres. It was a test of a weapon for destroying satellites, and the first by any country in about two decades.",
      "The satellite became a cloud. On the globe the count goes from {count:2007-01-10} objects to {count:2007-01-11} in a day. More than 1,200 pieces were catalogued within months; the catalogue now holds 3,531. NASA's orbital debris office called it “the single worst contamination of low Earth orbit (LEO) during the past 50 years.”",
      "The cloud reaches from about 200 to almost 4,000 kilometres and crosses the orbits of hundreds of working satellites, and the height where people fly. Nearly twenty years later, about two thirds of the catalogued pieces are still up. A month after the test, a subcommittee of the UN's space committee adopted guidelines asking countries not to destroy satellites in ways that leave long-lived debris.",
      "Every one of those pieces is one more thing for the next satellite to hit. Two years and a month later, two whole satellites collided at about 790 kilometres, a height the cloud also covers.",
    ],
    focus: { lat: 28.25, lon: 102.03 },
    highlight: [25730],
    sources: [
      { label: "NASA ODPO, Orbital Debris Quarterly News 11-2 (2007)", url: "https://orbitaldebris.jsc.nasa.gov/quarterly-news/pdfs/odqnv11i2.pdf" },
      { label: "T. S. Kelso, CelesTrak: Chinese ASAT Test", url: "https://celestrak.org/events/asat.php" },
      { label: "Secure World Foundation: 2007 Chinese Anti-Satellite Test", url: "https://swfound.org/media/9550/chinese_asat_fact_sheet_updated_2012.pdf" },
    ],
  },
  {
    id: "iridium-kosmos",
    date: "2009-02-10",
    kicker: "10 February 2009",
    title: "Two satellites",
    body: [
      "At 16:56 UTC, about 790 kilometres above northern Siberia, Iridium 33, a working communications satellite, and Kosmos 2251, a Russian military satellite that had been dead for years, crossed paths at nearly a right angle and hit at more than 11 kilometres a second.",
      "Debris had hit satellites before. This was the first accidental collision between two whole ones. The pair had shown up in public screening reports for days, with predicted misses between 117 metres and 1.8 kilometres, but the data weren't precise enough to act on, and that week other Iridium satellites had closer predicted passes.",
      "The collision left 2,370 catalogued fragments; the count on the globe goes from {count:2009-02-09} to {count:2009-02-10}. It was the second new cloud in two years, after Fengyun-1C. Kessler called it “the first clear example” of what he had predicted in 1978.",
    ],
    focus: { lat: 72, lon: 98 },
    highlight: [24946, 22675],
    sources: [
      { label: "NASA ODPO, Orbital Debris Quarterly News 13-2 (2009)", url: "https://orbitaldebris.jsc.nasa.gov/quarterly-news/pdfs/odqnv13i2.pdf" },
      { label: "T. S. Kelso, CelesTrak: Iridium 33/Cosmos 2251 Collision", url: "https://celestrak.org/events/collision/" },
      { label: "D. J. Kessler, The Kessler Syndrome (2009)", url: "https://aquarid.physics.uwo.ca/kessler/KesSym.html" },
      { label: "The Space Review: article 1314 (2009)", url: "https://thespacereview.com/article/1314/1" },
    ],
  },
  {
    id: "aissat-1",
    date: "2010-07-12",
    kicker: "12 July 2010",
    title: "Turning on the light",
    body: [
      "Among the passengers on an Indian rocket from Sriharikota was a cube 20 centimetres across, weighing about 6 kilograms: AISSat-1. Ships over 300 gross tonnes have to broadcast their identity, position, speed and heading on a radio system called AIS. Stations on land only hear the ships near the coast. AISSat-1 was built to listen from orbit, over the Barents Sea and the Norwegian Sea.",
      "The next day, at 10:56, red arrows marking ships began appearing on a screen at the Norwegian Coastal Administration. An officer at the Norwegian Joint Headquarters later said the first two years were like turning on the light in those seas.",
      "It cost 28 million kroner, including the launch and three years of operation, and it worked for about ten. Norway already owned satellites; AISSat-1 was its first national one, paid for by the state and made to Norwegian requirements, though the satellite itself was built in Toronto. Trond Giske called it “one small satellite but one giant leap for Norwegian space travel.” It came almost 48 years after Ferdinand left Andøya. AISSat-2 and a line of NorSats followed.",
    ],
    focus: { lat: 72, lon: 25 },
    highlight: [36797, 40075, 42826, 42828],
    sources: [
      { label: "FFI: It was like turning on the light (2022)", url: "https://www.ffi.no/en/news/it-was-like-turning-on-the-light" },
      { label: "Store norske leksikon: AISSat", url: "https://snl.no/AISSat" },
      { label: "UTIAS Space Flight Laboratory: AISSat-1", url: "https://sflmissions.com/aissat-1/" },
    ],
  },
  {
    id: "doves",
    date: "2017-02-15",
    kicker: "15 February 2017",
    title: "A flock",
    body: [
      "Planet's first Doves went up in 2013: satellites three of the ten-centimetre cubes long, built mostly from parts you could buy. In February 2014, 28 of them were pushed out of the space station. On 15 February 2017 one Indian rocket carried 104 satellites into orbit, and 88 of them were Doves.",
      "That November the company announced it could photograph all of the Earth's land every day. With a new picture of almost any place on land every day, you could follow a flood or a building site as it happened instead of waiting weeks for one expensive image.",
      "Small satellites changed the numbers. The catalogue records 109 satellites launched in 2007, 132 in 2012 and 453 in 2017. Many of them don't last: of the 657 Doves and Flocks catalogued, 114 are still in orbit.",
    ],
    focus: { lat: 13.72, lon: 80.23 },
    sources: [
      { label: "Planet: Mission 1 Complete! (2017)", url: "https://www.planet.com/pulse/mission-1/" },
      { label: "J. McDowell, Jonathan's Space Report no. 694 (2014)", url: "https://www.planet4589.org/space/jsr/back/news.694.txt" },
      { label: "NASA: NASA Evaluates Commercial Small-Sat Earth Data for Science (2018)", url: "https://www.nasa.gov/news-release/nasa-evaluates-commercial-small-sat-earth-data-for-science" },
    ],
  },
  {
    id: "starlink",
    date: "2019-05-24",
    kicker: "24 May 2019",
    title: "Sixty at once",
    body: [
      "At 02:30 UTC a Falcon 9 lifted off from Cape Canaveral with 60 flat satellites stacked in its nose, about 13.6 tonnes in all, the heaviest load the rocket had carried. They were released at about 440 kilometres and began raising themselves towards 550 with small electric thrusters.",
      "That evening in Leiden the satellite watcher Marco Langbroek filmed them crossing the sky in a line, close together, and reports of strange lights came in from across north-west Europe. In 1968 a girl in Canada had thanked a falling balloon for making her look up. Fifty-one years later a great many people looked up, and did not know what they were seeing.",
      "The next night, at Lowell Observatory in Arizona, Victoria Girgis's picture of a group of galaxies was crossed by the trails of more than 25 of them. On 3 June the International Astronomical Union warned that constellations like this “can pose a significant or debilitating threat” to astronomy.",
      "SpaceX already had permission from the US regulator for 11,943 satellites. In October, filings for 30,000 more went to the International Telecommunication Union.",
      "Sixty-one and a half years after Sputnik, the catalogue had grown to {count:2019-05-24} objects in orbit, {count:2019-05-24:satellites} of them satellites, working or not. Vanguard 1 was one of them, still the oldest, and by now it had gone round the Earth {orbits:5:2019-05-24} times. All sixty Starlinks have since come down, the last in October 2022. What took their place is chapter 2.",
    ],
    focus: { lat: 52.16, lon: 4.49 },
    highlight: Array.from({ length: 60 }, (_, k) => 44235 + k),
    sources: [
      { label: "M. Langbroek, SatTrackCam Leiden (May 2019)", url: "https://sattrackcam.blogspot.com/2019/05/wowowow-spectacular-view-of-spacex.html" },
      { label: "IAU Statement on Satellite Constellations (3 June 2019)", url: "https://iauarchive.eso.org/news/announcements/detail/ann19035/" },
      { label: "AmericaSpace: Record-setting Falcon 9 launches first 60 Starlink satellites (2019)", url: "https://www.americaspace.com/2019/05/24/record-setting-falcon-9-launches-first-60-starlink-satellites-to-orbit/" },
      { label: "SpaceNews: SpaceX submits paperwork for 30,000 more Starlink satellites (2019)", url: "https://spacenews.com/spacex-submits-paperwork-for-30000-more-starlink-satellites/" },
    ],
  },
];
