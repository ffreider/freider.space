import Image from "next/image";
import Link from "next/link";
import { framsatTle } from "@/lib/framsat-tle";
import { recentReceptions } from "@/lib/satnogs";
import { FramsatSection } from "./framsat";
import type { L, Lang } from "./i18n";

// The whole page, in English (/) or Norwegian (/no).

type YearMonth = [year: number, month: number];

type Role = {
  start: YearMonth;
  title: L;
  note?: L;
};

type Entry = {
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
const timeline: Entry[] = [
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

const startOf = (entry: Entry) => entry.roles[entry.roles.length - 1].start;

export const TEXT = {
  en: {
    tagline: "I like starting things, mostly about space.",
    experience: "Experience",
    bio: "I’m Freider Fløan, a student of electronic systems design and space systems at NTNU in Trondheim, Norway. I co-founded NORSTEC, the Norwegian Space Technology Collective, led it as President for three years and now sit on its board. I also host the podcast Spacepodden and chair NASA HUNCH Norge, and I’m working on a new startup, Meso Manufacturing.",
    otherLanguage: { label: "Norsk", href: "/no", lang: "nb" },
    chartAria: "Timeline of roles running in parallel",
    now: "now",
    featured: "Featured",
    articleMeta: "Trondheim.com, 3 September 2026. A 6 minute read.",
    articleSummary:
      "An NTNU engineering degree turned into satellites, SpaceX and NORSTEC. A profile of the student helping shape Norway’s next generation of space talent.",
    articleByline: "By McKenna Starck. Photo: Ludvik Hestbek, TRD Brand.",
    articleCta: "Read the article",
    articleAlt: "Freider Fløan, photographed for Trondheim.com",
    education: "Education",
    degrees: [
      "MSc, Electronic Systems Design (space systems), NTNU",
      "BSc, Economics and Business Administration, NTNU Business School",
    ],
    finishing: "Finishing soon ish.",
    privacy:
      "Privacy: this site sets no cookies. Visits are counted anonymously with Vercel Web Analytics. Waterfall images load from SatNOGS only if you open one.",
  },
  no: {
    tagline: "Jeg liker å starte ting, mest innen romfart.",
    experience: "Erfaring",
    bio: "Jeg heter Freider Fløan og studerer elektronisk systemdesign med fordypning i romsystemer ved NTNU i Trondheim. Jeg er medgründer av NORSTEC, Norwegian Space Technology Collective, som jeg ledet som president i tre år, og sitter nå i styret. I tillegg er jeg programleder for podkasten Spacepodden og styreleder i NASA HUNCH Norge, og jeg jobber med et nytt oppstartsselskap, Meso Manufacturing.",
    otherLanguage: { label: "English", href: "/", lang: "en" },
    chartAria: "Tidslinje over roller som går parallelt",
    now: "nå",
    featured: "Omtalt",
    articleMeta: "Trondheim.com, 3. september 2026. Seks minutter, på engelsk.",
    articleSummary:
      "En ingeniørgrad fra NTNU som ble til satellitter, SpaceX og NORSTEC. Et portrett av studenten som er med på å forme neste generasjon norske romfartstalenter.",
    articleByline: "Av McKenna Starck. Foto: Ludvik Hestbek, TRD Brand.",
    articleCta: "Les artikkelen",
    articleAlt: "Freider Fløan, fotografert for Trondheim.com",
    education: "Utdanning",
    degrees: [
      "Master i elektronisk systemdesign (romsystemer), NTNU",
      "Bachelor i økonomi og administrasjon, NTNU Handelshøyskolen",
    ],
    finishing: "Ferdig snart, sånn ca.",
    privacy:
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

const links = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/freider/" },
  { label: "GitHub", href: "https://github.com/ffreider" },
];

const FIRST_YEAR = 2019;
const LAST_YEAR = 2027;
const years = Array.from({ length: LAST_YEAR - FIRST_YEAR }, (_, i) => FIRST_YEAR + i);

const toYears = ([year, month]: YearMonth) => year + (month - 1) / 12;
const today = new Date();
const now = today.getFullYear() + today.getMonth() / 12;

// Position on the chart as a percentage of its width.
const pct = (t: number) => ((t - FIRST_YEAR) / (LAST_YEAR - FIRST_YEAR)) * 100;

const period = (start: YearMonth, end: YearMonth | undefined, lang: Lang) =>
  end
    ? start[0] === end[0]
      ? `${start[0]}`
      : `${start[0]}-${end[0]}`
    : `${start[0]}-${TEXT[lang].now}`;

// Each role with the stretch of time it covers, newest first. A role ends
// where the next one starts.
function spans(entry: Entry) {
  return entry.roles.map((role, i) => {
    const newer = entry.roles[i - 1];
    return {
      role,
      end: newer ? newer.start : entry.end,
      from: toYears(role.start),
      to: newer ? toYears(newer.start) : entry.end ? toYears(entry.end) + 1 / 12 : now,
      current: i === 0 && !entry.end,
      first: i === entry.roles.length - 1,
    };
  });
}

// The bar colour (--bar, set per design study) is mapped to time across the
// whole chart, so with a gradient every bar shows the slice that matches the
// years it covers.
function barSlice(left: number, width: number) {
  const size = (100 / width) * 100;
  const position = width >= 100 ? 0 : (left / (100 - width)) * 100;
  return {
    background: "var(--bar)",
    backgroundSize: `${size}% 100%`,
    backgroundPosition: `${position}% 0`,
  };
}

const linkClass = "underline decoration-fg-4 underline-offset-4 hover:decoration-accent";

// Every organization as a line on a shared time axis, so overlaps are visible
// at a glance. A line with several roles is split into segments, with a tick
// where one role hands over to the next, and only the current role at full
// strength.
function ParallelChart({ lang }: { lang: Lang }) {
  const nowPct = pct(now);

  return (
    <figure aria-label={TEXT[lang].chartAria} className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {years.map((year) => (
          <div
            key={year}
            className="absolute inset-y-0 border-l border-line/60"
            style={{ left: `${pct(year)}%` }}
          >
            <span className="absolute -bottom-6 left-1 font-mono text-[10px] text-fg-4">
              ’{String(year).slice(2)}
            </span>
          </div>
        ))}
        <div
          className="absolute inset-y-0 border-l border-dashed border-fg-4"
          style={{ left: `${nowPct}%` }}
        >
          <span className="absolute -top-6 -translate-x-1/2 font-mono text-[10px] text-fg-3">
            {TEXT[lang].now}
          </span>
        </div>
      </div>

      <ol className="chart-rows relative">
        {timeline.map((entry, i) => {
          const segments = spans(entry);
          const left = pct(toYears(startOf(entry)));
          const ongoing = !entry.end;
          const right = pct(segments[0].to);
          // Put the label on whichever side of the line has more room.
          const labelBefore = left > 100 - right;

          return (
            <li
              key={entry.org.en}
              tabIndex={0}
              className="group relative h-8 cursor-default outline-none hover:z-10 focus:z-10"
            >
              {segments.map(({ role, from, to, current, first }) => {
                const segLeft = pct(from);
                const segWidth = Math.max(pct(to) - segLeft, 0.8);
                return (
                  <span
                    key={role.title.en}
                    className={`absolute top-1/2 h-[3px] -translate-y-1/2 origin-left motion-safe:animate-[draw_1.4s_cubic-bezier(0.2,0.7,0.2,1)_both] ${
                      current
                        ? ""
                        : // An earlier role somewhere you still are fades less than a place you've left.
                          `${ongoing ? "opacity-60" : "opacity-[var(--bar-past)]"} transition-opacity group-hover:opacity-100 group-focus:opacity-100`
                    }`}
                    style={{
                      // A 3px gap before every role but the first marks the handover.
                      left: first ? `${segLeft}%` : `calc(${segLeft}% + 3px)`,
                      width: first ? `${segWidth}%` : `calc(${segWidth}% - 3px)`,
                      animationDelay: `${(timeline.length - i) * 60}ms`,
                      ...barSlice(segLeft, segWidth),
                    }}
                  />
                );
              })}
              {segments.map(({ role, from, first }) =>
                first ? (
                  <span
                    key={role.title.en}
                    className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg-4"
                    style={{ left: `${pct(from)}%` }}
                  />
                ) : (
                  <span
                    key={role.title.en}
                    className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-fg-3"
                    style={{ left: `calc(${pct(from)}% + 1px)` }}
                  />
                ),
              )}
              {ongoing && (
                <span
                  className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
                  style={{ left: `${nowPct}%` }}
                />
              )}
              <span
                className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] ${
                  ongoing ? "text-fg" : "text-fg-3"
                } ${labelBefore ? "pr-2.5" : "pl-2.5"}`}
                style={labelBefore ? { right: `${100 - left}%` } : { left: `${right}%` }}
              >
                {(entry.short ?? entry.org)[lang]}
              </span>

              {/* Details card on hover or keyboard focus. Full width on phones,
                  anchored to the line on larger screens. */}
              <div
                className={`pointer-events-none absolute inset-x-0 z-20 translate-y-1 rounded-card border border-line bg-background p-3 text-left opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100 sm:w-72 ${
                  i >= timeline.length / 2 ? "bottom-full mb-1" : "top-full mt-1"
                } ${labelBefore ? "sm:left-auto sm:right-[var(--r)]" : "sm:right-auto sm:left-[var(--l)]"}`}
                style={
                  {
                    "--l": `${left}%`,
                    "--r": `${100 - right}%`,
                  } as React.CSSProperties
                }
              >
                <p className="font-mono text-[10px] text-fg-3">{period(startOf(entry), entry.end, lang)}</p>
                <p className="mt-0.5 text-sm font-medium">{entry.org[lang]}</p>
                {segments.length === 1 ? (
                  <p className="text-xs text-fg-2">{entry.roles[0].title[lang]}</p>
                ) : (
                  <ul className="mt-1 space-y-0.5">
                    {segments.map(({ role, end, current }) => (
                      <li key={role.title.en} className="flex gap-2 text-xs">
                        <span className="w-[4.5rem] shrink-0 font-mono text-[10px] leading-4 text-fg-3">
                          {period(role.start, end, lang)}
                        </span>
                        <span className={current ? "text-fg" : "text-fg-2"}>{role.title[lang]}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {entry.description && (
                  <p className="mt-1.5 text-xs leading-relaxed text-fg-2">{entry.description[lang]}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

export async function Home({ lang }: { lang: Lang }) {
  const [tle, receptions] = await Promise.all([framsatTle(), recentReceptions()]);
  const t = TEXT[lang];

  return (
    <div lang={lang === "no" ? "nb" : "en"} className="contents">
      <script
        type="application/ld+json"
        // Structured data: who this page is about, for search engines and AI.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(lang)) }}
      />
      <main className="relative mx-auto w-full max-w-3xl px-6 pt-24 sm:px-8 sm:pt-40">
        <Link
          href={t.otherLanguage.href}
          hrefLang={t.otherLanguage.lang}
          lang={t.otherLanguage.lang}
          className="absolute right-6 top-6 text-sm text-fg-3 hover:text-fg sm:right-8 sm:top-8"
        >
          {t.otherLanguage.label}
        </Link>

        {/* Laid out in globals.css (.hero). */}
        <header className="hero">
          <Image
            src="/freider.jpg"
            alt="Freider Fløan"
            width={480}
            height={480}
            priority
            sizes="(min-width: 768px) 360px, 100vw"
            data-launch
            className="hero-photo"
          />
          <h1 className="hero-name display">
            Freider
            <br />
            Fløan
          </h1>
          <p className="hero-tagline">{t.tagline}</p>
          <nav className="hero-links flex gap-6 text-sm">
            {links.map((link) => (
              <a key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </a>
            ))}
          </nav>
        </header>

        <p className="mt-24 max-w-[60ch] text-lg leading-relaxed text-fg-2 sm:mt-32">{t.bio}</p>

        <section className="mt-24 sm:mt-32">
          <ParallelChart lang={lang} />
        </section>

        <h2 className="display mt-32 text-lg sm:mt-40">{t.experience}</h2>
        <ol className="mt-10 space-y-12">
          {timeline.map((entry) => (
            <li key={entry.org.en} className="grid gap-x-6 sm:grid-cols-[7rem_1fr]">
              <p className="font-mono text-xs leading-6 text-fg-3">{period(startOf(entry), entry.end, lang)}</p>
              <div>
                <h3 className="font-medium">
                  {entry.href ? (
                    <a href={entry.href} className={linkClass}>
                      {entry.org[lang]}
                    </a>
                  ) : (
                    entry.org[lang]
                  )}
                </h3>
                {entry.roles.length === 1 ? (
                  <p className="text-sm text-fg-2">{entry.roles[0].title[lang]}</p>
                ) : (
                  // Several roles: a small rail, newest on top, the current role marked red.
                  <ol className="mt-3 space-y-3 border-l border-line">
                    {spans(entry).map(({ role, end, current }) => (
                      <li key={role.title.en} className="relative pl-4">
                        <span
                          aria-hidden
                          className={`absolute -left-[3.5px] top-[7px] size-1.5 rounded-full ${current ? "bg-accent" : "bg-fg-4"}`}
                        />
                        <p className="text-sm">
                          <span className={current ? "text-fg" : "text-fg-2"}>{role.title[lang]}</span>
                          <span className="ml-2 font-mono text-[11px] text-fg-3">{period(role.start, end, lang)}</span>
                        </p>
                        {role.note && <p className="text-xs leading-relaxed text-fg-3">{role.note[lang]}</p>}
                      </li>
                    ))}
                  </ol>
                )}
                {entry.description && (
                  <p className="mt-3 text-sm leading-relaxed text-fg-2">{entry.description[lang]}</p>
                )}
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-32 sm:mt-40">
          <h2 className="display text-lg">{t.featured}</h2>
          <a
            href="https://trondheim.com/journal/the-extracurricular-that-left-earth"
            hrefLang="en"
            className="group mt-4 block overflow-hidden rounded-card border border-line bg-surface transition hover:border-fg-4"
          >
            <Image
              src="https://cdn.sanity.io/images/x3figu6z/production/acfe7bfa0570bcc2a1856ea583d38181b80c7440-5611x3741.jpg?rect=0,425,5611,2946&w=1200&h=630"
              alt={t.articleAlt}
              width={1200}
              height={630}
              sizes="(min-width: 768px) 720px, 100vw"
              className="aspect-[1200/630] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            />
            <div className="p-6">
              <p className="font-mono text-xs text-fg-3">{t.articleMeta}</p>
              <h3 lang="en" className="display mt-2 text-xl">
                The extracurricular that left Earth
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-2">{t.articleSummary}</p>
              <p className="mt-4 text-xs text-fg-3">
                {t.articleByline} <span className="text-fg underline decoration-accent underline-offset-4">{t.articleCta}</span>
              </p>
            </div>
          </a>
        </section>

        <section className="mt-32 border-t border-line pt-12 text-sm sm:mt-40">
          <h2 className="display text-lg">{t.education}</h2>
          <ul className="mt-4 space-y-2 text-fg-2">
            {t.degrees.map((degree) => (
              <li key={degree}>
                {degree}. {t.finishing}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <FramsatSection tle={tle} receptions={receptions} lang={lang} />

      <footer className="mx-auto w-full max-w-3xl px-6 pb-12 sm:px-8">
        <p className="text-xs text-fg-4">{t.privacy}</p>
      </footer>
    </div>
  );
}
