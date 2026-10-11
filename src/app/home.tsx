import { Descent } from "./descent/descent";
import type { L, Lang } from "./i18n";

// The homepage, in English (/) or Norwegian (/no): the content (timeline and
// text) and the structured data. The page itself is the descent, from the Moon
// to FramSat-1 (src/app/descent), which renders this content.

export type YearMonth = [year: number, month: number];

type Role = {
  start: YearMonth;
  title: L;
  note?: L;
};

export type Entry = {
  end?: YearMonth; // omitted = ongoing
  org: L;
  short?: L; // label in the chart, when the full name is too long
  href?: string;
  description?: L;
  // Newest first. Each role runs until the next one starts, and the last
  // until the entry's end.
  roles: Role[];
};

const same = (text: string): L => ({ en: text, no: text });

// Newest first, by when the first role started. Months are approximate where
// the exact month isn't known.
export const timeline: Entry[] = [
  {
    org: same("Meso Manufacturing"),
    href: "https://www.mesomanufacturing.com/",
    short: same("Meso"),
    roles: [{ start: [2026, 1], title: { en: "Working on a new startup", no: "Jobber med et nytt oppstartsselskap" } }],
  },
  {
    org: same("NASA HUNCH Norge"),
    short: same("NASA HUNCH"),
    href: "https://nasahunch.no",
    roles: [{ start: [2025, 8], title: { en: "Chair of the board", no: "Styreleder" } }],
  },
  {
    org: same("Spacepodden"),
    href: "https://open.spotify.com/show/7ofO8qm8tRBk2llQEMK8JB",
    description: {
      en: "A weekly Norwegian-language podcast about space.",
      no: "En ukentlig norskspråklig podkast om verdensrommet.",
    },
    roles: [{ start: [2024, 10], title: { en: "Host", no: "Programleder" } }],
  },
  {
    org: same("NORSTEC Summit"),
    short: same("Summit"),
    href: "https://norstec.no/summit",
    description: {
      en: "Norway's annual space conference. First held March 2026 in Trondheim.",
      no: "Norges årlige romfartskonferanse. Arrangert første gang i mars 2026 i Trondheim.",
    },
    roles: [{ start: [2024, 9], title: { en: "Co-founder and chair", no: "Medgründer og styreleder" } }],
  },
  {
    org: same("Tekna Romfart"),
    href: "https://www.tekna.no/fag-og-nettverk/samferdsel-og-infrastruktur/tekna-romfart/",
    roles: [{ start: [2024, 3], title: { en: "Board member", no: "Styremedlem" } }],
  },
  {
    org: same("NORSTEC"),
    href: "https://norstec.no",
    description: {
      en: "The Norwegian Space Technology Collective, an umbrella organization for 10 student space and rocketry organizations with 550+ members.",
      no: "Norwegian Space Technology Collective, en paraplyorganisasjon for 10 studentorganisasjoner innen romfart og rakett, med over 550 medlemmer.",
    },
    roles: [
      { start: [2026, 9], title: { en: "Board member", no: "Styremedlem" } },
      { start: [2023, 10], title: { en: "Co-founder and President", no: "Medgründer og president" } },
    ],
  },
  {
    end: [2024, 8],
    org: same("Kongsberg Defence & Aerospace"),
    href: "https://www.kongsberg.com/what-we-do/space/",
    short: same("Kongsberg"),
    roles: [
      { start: [2024, 6], title: { en: "Summer intern, Oslo", no: "Sommerpraktikant, Oslo" } },
      {
        start: [2023, 10],
        title: { en: "Project liaison", no: "Prosjektkontakt" },
        note: {
          en: "Part-time, on a three-year student satellite project.",
          no: "Deltid, i et treårig studentsatellittprosjekt.",
        },
      },
    ],
  },
  {
    end: [2023, 8],
    org: same("KSAT"),
    href: "https://www.ksat.no/",
    description: {
      en: "Satellite communication and orbital mechanics.",
      no: "Satellittkommunikasjon og banemekanikk.",
    },
    roles: [{ start: [2023, 6], title: { en: "Summer intern, Tromsø", no: "Sommerpraktikant, Tromsø" } }],
  },
  {
    end: [2022, 8],
    org: same("NTNU"),
    short: { en: "NTNU intern", no: "NTNU-praktikant" },
    roles: [{ start: [2022, 6], title: { en: "Satellite operations intern", no: "Praktikant i satellittoperasjoner" } }],
  },
  {
    end: [2026, 5],
    org: same("Orbit NTNU"),
    href: "https://orbitntnu.com/",
    description: {
      en: "The student satellite program behind SelfieSat, FramSat-1/1.5 and BioSat.",
      no: "Studentsatellittprogrammet bak SelfieSat, FramSat-1/1.5 og BioSat.",
    },
    roles: [
      {
        start: [2025, 9],
        title: { en: "Financial controller", no: "Økonomiansvarlig" },
        note: { en: "Finances and launch procurement.", no: "Økonomi og innkjøp av oppskytning." },
      },
      {
        start: [2024, 4],
        title: { en: "Program director, satellites", no: "Programdirektør for satellitter" },
        note: {
          en: "All four satellite projects: SelfieSat, FramSat-1, FramSat-1.5 and BioSat.",
          no: "Alle fire satellittprosjektene: SelfieSat, FramSat-1, FramSat-1.5 og BioSat.",
        },
      },
      {
        start: [2022, 5],
        title: { en: "Project manager, BioSat", no: "Prosjektleder, BioSat" },
        note: { en: "From phase 0 to phase C.", no: "Fra fase 0 til fase C." },
      },
      {
        start: [2021, 8],
        title: { en: "Electronics, SubOrbital", no: "Elektronikk, SubOrbital" },
        note: { en: "Circuit board design.", no: "Kretskortdesign." },
      },
    ],
  },
  {
    end: [2020, 6],
    org: { en: "Norwegian Armed Forces", no: "Forsvaret" },
    short: { en: "Military service", no: "Førstegangstjeneste" },
    description: {
      en: "NATO Joint Warfare Centre. Led a team of eight smoke divers.",
      no: "NATOs Joint Warfare Centre. Ledet et lag på åtte røykdykkere.",
    },
    roles: [{ start: [2019, 7], title: { en: "Smoke diver and team leader", no: "Røykdykker og lagfører" } }],
  },
];

// Shared text. The descent adds its own interface strings in
// public/descent/core.js and main.js.
export const TEXT = {
  en: {
    tagline: "I like starting things, mostly about space.",
    hint: "Scroll slowly. Everything you pass is placed from its latest orbital elements, in real time. Hover things to learn more.",
    about: "About",
    bio: "I’m Freider Fløan, a student of electronic systems design and space systems at NTNU in Trondheim, Norway. I co-founded NORSTEC, the Norwegian Space Technology Collective, led it as President for three years and now sit on its board. I also host the podcast Spacepodden and chair NASA HUNCH Norge, and I’m working on a new startup, Meso Manufacturing.",
    experience: "Experience",
    featured: "Featured",
    articleMeta: "Trondheim.com, 3 September 2026. A 6 minute read.",
    articleSummary:
      "An NTNU engineering degree turned into satellites, SpaceX and NORSTEC. A profile of the student helping shape Norway’s next generation of space talent.",
    articleByline: "By McKenna Starck. Photo: Ludvik Hestbek, TRD Brand.",
    articleCta: "Read it on Trondheim.com",
    education: "Education",
    degrees: [
      "MSc, Electronic Systems Design (space systems), NTNU",
      "BSc, Economics and Business Administration, NTNU Business School",
    ],
    finishing: "Working on it... Finishing soon ish.",
    joining: "Joining FramSat-1",
    whyHtml:
      'A student satellite I worked on at <a href="https://orbitntnu.com/projects/FramSat-1" target="_blank" rel="noopener">Orbit NTNU</a>, launched on 5 September 2026.',
    privacy: "Privacy: this site sets no cookies. Visits are counted anonymously with Vercel Web Analytics.",
    privacyTracker:
      "Privacy: this site sets no cookies. Visits are counted anonymously with Vercel Web Analytics. Waterfall images load from SatNOGS only if you open one.",
  },
  no: {
    tagline: "Jeg liker å starte ting, mest innen romfart.",
    hint: "Scroll rolig. Alt du passerer er plassert fra de nyeste banedataene, i sanntid. Hold over ting for å lære mer.",
    about: "Om meg",
    bio: "Jeg heter Freider Fløan og studerer elektronisk systemdesign med fordypning i romsystemer ved NTNU i Trondheim. Jeg er medgründer av NORSTEC, Norwegian Space Technology Collective, som jeg ledet som president i tre år, og sitter nå i styret. I tillegg er jeg programleder for podkasten Spacepodden og styreleder i NASA HUNCH Norge, og jeg jobber med et nytt oppstartsselskap, Meso Manufacturing.",
    experience: "Erfaring",
    featured: "Omtalt",
    articleMeta: "Trondheim.com, 3. september 2026. Seks minutter, på engelsk.",
    articleSummary:
      "En ingeniørgrad fra NTNU som ble til satellitter, SpaceX og NORSTEC. Et portrett av studenten som er med på å forme neste generasjon norske romfartstalenter.",
    articleByline: "Av McKenna Starck. Foto: Ludvik Hestbek, TRD Brand.",
    articleCta: "Les den på Trondheim.com",
    education: "Utdanning",
    degrees: [
      "Master i elektronisk systemdesign (romsystemer), NTNU",
      "Bachelor i økonomi og administrasjon, NTNU Handelshøyskolen",
    ],
    finishing: "Jobber med saken... Ferdig snart, sånn ca.",
    joining: "Slår følge med FramSat-1",
    whyHtml:
      'En studentsatellitt jeg jobbet med i <a href="https://orbitntnu.com/projects/FramSat-1" target="_blank" rel="noopener">Orbit NTNU</a>, skutt opp 5. september 2026.',
    privacy: "Personvern: denne siden bruker ingen informasjonskapsler. Besøk telles anonymt med Vercel Web Analytics.",
    privacyTracker:
      "Personvern: denne siden bruker ingen informasjonskapsler. Besøk telles anonymt med Vercel Web Analytics. Vannfallsdiagrammer lastes fra SatNOGS bare hvis du åpner et.",
  },
};

// schema.org description of the page and the person it's about. Only
// facts that are also on the page.
function structuredData(lang: Lang) {
  const site = "https://freider.space";
  const org = (name: string, url?: string) => ({ "@type": "Organization", name, ...(url && { url }) });
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: lang === "no" ? `${site}/no` : site,
    inLanguage: lang === "no" ? "nb" : "en",
    mainEntity: {
      "@type": "Person",
      "@id": `${site}/#person`,
      name: "Freider Fløan",
      alternateName: "Freider Floan",
      url: site,
      image: `${site}/freider.jpg`,
      description: TEXT[lang].bio,
      jobTitle: lang === "no" ? "Medgründer av NORSTEC" : "Co-founder of NORSTEC",
      nationality: { "@type": "Country", name: "Norway" },
      homeLocation: { "@type": "Place", name: "Trondheim, Norway" },
      affiliation: [
        { "@type": "CollegeOrUniversity", name: "NTNU", url: "https://www.ntnu.no" },
        org("NORSTEC", "https://norstec.no"),
        org("NORSTEC Summit", "https://norstec.no/summit"),
        org("Spacepodden", "https://open.spotify.com/show/7ofO8qm8tRBk2llQEMK8JB"),
        org("NASA HUNCH Norge", "https://nasahunch.no"),
        org("Meso Manufacturing", "https://www.mesomanufacturing.com/"),
        org("Tekna Romfart"),
        org("Orbit NTNU", "https://orbitntnu.com/"),
      ],
      knowsAbout: [
        "Space technology",
        "Small satellites",
        "Satellite operations",
        "Orbital mechanics",
        "Student organizations",
        "Additive manufacturing",
      ],
      sameAs: ["https://www.linkedin.com/in/freider/", "https://github.com/ffreider"],
      subjectOf: {
        "@type": "Article",
        headline: "The extracurricular that left Earth",
        url: "https://trondheim.com/journal/the-extracurricular-that-left-earth",
        datePublished: "2026-09-03",
        author: { "@type": "Person", name: "McKenna Starck" },
        publisher: org("Trondheim.com", "https://trondheim.com"),
      },
    },
  };
}

export function Home({ lang }: { lang: Lang }) {
  return (
    <>
      <script
        type="application/ld+json"
        // Structured data: who this page is about, for search engines and AI.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(lang)) }}
      />
      <Descent lang={lang} timeline={timeline} text={TEXT} />
    </>
  );
}
