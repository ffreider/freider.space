import Image from "next/image";
import Link from "next/link";
import { Unbounded } from "next/font/google";
import { framsatTle } from "@/lib/framsat-tle";
import { recentReceptions } from "@/lib/satnogs";
import { FramsatSection } from "./framsat";
import type { L, Lang } from "./i18n";

// The whole page, in English (/) or Norwegian (/no).

const display = Unbounded({ subsets: ["latin"], weight: "600" });

type YearMonth = [year: number, month: number];

type Entry = {
  start: YearMonth;
  end?: YearMonth; // omitted = ongoing
  org: L;
  short?: L; // label in the chart, when the full name is too long
  href?: string;
  role: L;
  description?: L;
};

const same = (text: string): L => ({ en: text, no: text });

// Newest first. Months are approximate where the exact month isn't known.
const timeline: Entry[] = [
  {
    start: [2025, 11],
    org: same("Meso Manufacturing"),
    href: "https://www.mesomanufacturing.com/",
    short: same("Meso"),
    role: { en: "Co-founder", no: "Medgründer" },
    description: {
      en: "Working on large-scale 3D printing of high-performance composite parts.",
      no: "Jobber med storskala 3D-printing av komposittdeler med høy ytelse.",
    },
  },
  {
    start: [2025, 8],
    org: same("NASA HUNCH Norge"),
    short: same("NASA HUNCH"),
    href: "https://nasahunch.no",
    role: { en: "Chair of the board", no: "Styreleder" },
  },
  {
    start: [2024, 10],
    org: same("Spacepodden"),
    href: "https://open.spotify.com/show/7ofO8qm8tRBk2llQEMK8JB",
    role: { en: "Host", no: "Programleder" },
    description: {
      en: "A weekly Norwegian-language podcast about space.",
      no: "En ukentlig norskspråklig podkast om verdensrommet.",
    },
  },
  {
    start: [2024, 9],
    org: same("NORSTEC Summit"),
    short: same("Summit"),
    href: "https://norstec.no/summit",
    role: { en: "Co-founder and chair", no: "Medgründer og styreleder" },
    description: {
      en: "Norway's annual space conference. First held March 2026 in Trondheim.",
      no: "Norges årlige romfartskonferanse. Arrangert første gang i mars 2026 i Trondheim.",
    },
  },
  {
    start: [2024, 3],
    org: same("Tekna Romfart"),
    href: "https://www.tekna.no/fag-og-nettverk/samferdsel-og-infrastruktur/tekna-romfart/",
    role: { en: "Board member", no: "Styremedlem" },
  },
  {
    start: [2024, 2],
    org: same("NORSTEC"),
    href: "https://norstec.no",
    role: { en: "Co-founder and President", no: "Medgründer og president" },
    description: {
      en: "The Norwegian Space Technology Collective, an umbrella organization for 10 student space and rocketry organizations with 550+ members.",
      no: "Norwegian Space Technology Collective, en paraplyorganisasjon for 10 studentorganisasjoner innen romfart og rakett, med over 550 medlemmer.",
    },
  },
  {
    start: [2023, 10],
    end: [2024, 8],
    org: same("Kongsberg Defence & Aerospace"),
    href: "https://www.kongsberg.com/what-we-do/space/",
    short: same("Kongsberg"),
    role: { en: "Project liaison, then summer intern", no: "Prosjektkontakt, deretter sommerpraktikant" },
  },
  {
    start: [2023, 6],
    end: [2023, 8],
    org: same("KSAT"),
    href: "https://www.ksat.no/",
    role: { en: "Summer intern, Tromsø", no: "Sommerpraktikant, Tromsø" },
    description: {
      en: "Satellite communication and orbital mechanics.",
      no: "Satellittkommunikasjon og banemekanikk.",
    },
  },
  {
    start: [2022, 6],
    end: [2022, 8],
    org: same("NTNU"),
    short: { en: "NTNU intern", no: "NTNU-praktikant" },
    role: { en: "Satellite operations intern", no: "Praktikant i satellittoperasjoner" },
  },
  {
    start: [2021, 8],
    end: [2026, 5],
    org: same("Orbit NTNU"),
    href: "https://orbitntnu.com/",
    role: {
      en: "Program director, project manager and head of finance",
      no: "Programdirektør, prosjektleder og økonomiansvarlig",
    },
    description: {
      en: "Led the student satellite program: SelfieSat, FramSat-1/1.5 and BioSat.",
      no: "Ledet studentsatellittprogrammet: SelfieSat, FramSat-1/1.5 og BioSat.",
    },
  },
  {
    start: [2019, 7],
    end: [2020, 6],
    org: { en: "Norwegian Armed Forces", no: "Forsvaret" },
    short: { en: "Military service", no: "Førstegangstjeneste" },
    role: { en: "Smoke diver and team leader", no: "Røykdykker og lagfører" },
    description: {
      en: "NATO Joint Warfare Centre. Led a team of eight smoke divers.",
      no: "NATOs Joint Warfare Centre. Ledet et lag på åtte røykdykkere.",
    },
  },
];

const TEXT = {
  en: {
    tagline: "I like starting things, mostly about space.",
    otherLanguage: { label: "Norsk", href: "/no", lang: "nb" },
    chartAria: "Timeline of roles running in parallel",
    now: "now",
    featured: "Featured",
    articleMeta: "Trondheim.com · 3 September 2026 · 6 min read",
    articleSummary:
      "An NTNU engineering degree turned into satellites, SpaceX and NORSTEC. A profile of the student helping shape Norway’s next generation of space talent.",
    articleByline: "By McKenna Starck. Photo: Ludvik Hestbek, TRD Brand.",
    articleCta: "Read the article ↗",
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
    otherLanguage: { label: "English", href: "/", lang: "en" },
    chartAria: "Tidslinje over roller som går parallelt",
    now: "nå",
    featured: "Omtalt",
    articleMeta: "Trondheim.com · 3. september 2026 · 6 min lesing · på engelsk",
    articleSummary:
      "En ingeniørgrad fra NTNU som ble til satellitter, SpaceX og NORSTEC. Et portrett av studenten som er med på å forme neste generasjon norske romfartstalenter.",
    articleByline: "Av McKenna Starck. Foto: Ludvik Hestbek, TRD Brand.",
    articleCta: "Les artikkelen ↗",
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

const period = ({ start, end }: Entry, lang: Lang) =>
  end
    ? start[0] === end[0]
      ? `${start[0]}`
      : `${start[0]} – ${end[0]}`
    : `${start[0]} – ${TEXT[lang].now}`;

// The aurora gradient is mapped to time across the whole chart, so every
// bar shows the slice of color that matches the years it covers.
function auroraSlice(left: number, width: number) {
  const size = (100 / width) * 100;
  const position = width >= 100 ? 0 : (left / (100 - width)) * 100;
  return {
    backgroundImage: "var(--aurora)",
    backgroundSize: `${size}% 100%`,
    backgroundPosition: `${position}% 0`,
  };
}

const linkClass =
  "underline decoration-zinc-300 underline-offset-4 hover:decoration-current dark:decoration-zinc-600";

// Every role as a line on a shared time axis, so overlaps are visible at a glance.
function ParallelChart({ lang }: { lang: Lang }) {
  const nowPct = pct(now);

  return (
    <figure aria-label={TEXT[lang].chartAria} className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {years.map((year) => (
          <div
            key={year}
            className="absolute inset-y-0 border-l border-zinc-100 dark:border-zinc-900"
            style={{ left: `${pct(year)}%` }}
          >
            <span className="absolute -bottom-6 left-1 font-mono text-[10px] text-zinc-500">
              ’{String(year).slice(2)}
            </span>
          </div>
        ))}
        <div
          className="absolute inset-y-0 border-l border-dashed border-zinc-300 dark:border-zinc-700"
          style={{ left: `${nowPct}%` }}
        >
          <span className="absolute -top-6 -translate-x-1/2 font-mono text-[10px] text-zinc-400">
            {TEXT[lang].now}
          </span>
        </div>
      </div>

      <ol className="chart-rows relative">
        {timeline.map((entry, i) => {
          const left = pct(toYears(entry.start));
          const ongoing = !entry.end;
          const right = ongoing ? nowPct : pct(toYears(entry.end!) + 1 / 12);
          const width = Math.max(right - left, 0.8);
          // Put the label on whichever side of the line has more room.
          const labelBefore = left > 100 - right;

          return (
            <li
              key={entry.org.en}
              tabIndex={0}
              className="group relative h-8 cursor-default outline-none hover:z-10 focus:z-10"
            >
              <span
                className={`absolute top-1/2 h-[3px] -translate-y-1/2 origin-left rounded-full motion-safe:animate-[draw_1.4s_cubic-bezier(0.2,0.7,0.2,1)_both] ${
                  ongoing
                    ? "aurora-glow"
                    : "opacity-40 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
                }`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  animationDelay: `${(timeline.length - i) * 60}ms`,
                  ...auroraSlice(left, width),
                }}
              />
              <span
                className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-400 dark:bg-zinc-500"
                style={{ left: `${left}%` }}
              />
              {ongoing && (
                <span
                  className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${nowPct}%` }}
                >
                  <span className="absolute inset-0 rounded-full bg-[var(--aurora-end)] motion-safe:animate-ping" />
                  <span className="absolute inset-0 rounded-full bg-[var(--aurora-end)]" />
                </span>
              )}
              <span
                className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] ${
                  ongoing ? "text-zinc-100" : "text-zinc-400"
                } ${labelBefore ? "pr-2.5" : "pl-2.5"}`}
                style={labelBefore ? { right: `${100 - left}%` } : { left: `${right}%` }}
              >
                {(entry.short ?? entry.org)[lang]}
              </span>

              {/* Details card on hover or keyboard focus. Full width on phones,
                  anchored to the line on larger screens. */}
              <div
                className={`pointer-events-none absolute inset-x-0 z-20 translate-y-1 rounded-lg border border-zinc-200 bg-background p-3 text-left opacity-0 shadow-xl transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100 sm:w-72 dark:border-zinc-800 ${
                  i >= timeline.length / 2 ? "bottom-full mb-1" : "top-full mt-1"
                } ${labelBefore ? "sm:left-auto sm:right-[var(--r)]" : "sm:right-auto sm:left-[var(--l)]"}`}
                style={
                  {
                    "--l": `${left}%`,
                    "--r": `${100 - right}%`,
                  } as React.CSSProperties
                }
              >
                <p className="font-mono text-[10px] text-zinc-400">{period(entry, lang)}</p>
                <p className="mt-0.5 text-sm font-medium">{entry.org[lang]}</p>
                <p className="text-xs text-zinc-200">{entry.role[lang]}</p>
                {entry.description && (
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">{entry.description[lang]}</p>
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
      <main className="mx-auto w-full max-w-3xl px-6 pt-24 sm:px-8 sm:pt-40">
        <header className="flex flex-col items-center text-center">
          <Image
            src="/freider.jpg"
            alt="Freider Fløan"
            width={128}
            height={128}
            priority
            data-launch
            className="size-32 rounded-full object-cover"
          />
          <h1 className={`${display.className} mt-8 text-3xl sm:text-4xl`}>Freider Fløan</h1>
          <p className="mt-3 text-zinc-300">{t.tagline}</p>
          <nav className="mt-6 flex gap-6 text-sm">
            {links.map((link) => (
              <a key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </a>
            ))}
            <Link href={t.otherLanguage.href} hrefLang={t.otherLanguage.lang} className={linkClass}>
              {t.otherLanguage.label}
            </Link>
          </nav>
        </header>

        <section className="mt-32 sm:mt-40">
          <ParallelChart lang={lang} />
        </section>

        <ol className="mt-32 space-y-12 sm:mt-40">
          {timeline.map((entry) => (
            <li key={entry.org.en} className="grid gap-x-6 sm:grid-cols-[7rem_1fr]">
              <p className="font-mono text-xs leading-6 text-zinc-400">{period(entry, lang)}</p>
              <div>
                <h2 className="font-medium">
                  {entry.href ? (
                    <a href={entry.href} className={linkClass}>
                      {entry.org[lang]}
                    </a>
                  ) : (
                    entry.org[lang]
                  )}
                </h2>
                <p className="text-sm text-zinc-200">{entry.role[lang]}</p>
                {entry.description && (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">{entry.description[lang]}</p>
                )}
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-32 sm:mt-40">
          <p className="font-mono text-[10px] uppercase tracking-wide text-fuchsia-300">{t.featured}</p>
          <a
            href="https://trondheim.com/journal/the-extracurricular-that-left-earth"
            hrefLang="en"
            className="group mt-4 block overflow-hidden rounded-2xl border border-zinc-800 bg-background/85 transition hover:border-zinc-600"
          >
            <Image
              src="https://cdn.sanity.io/images/x3figu6z/production/acfe7bfa0570bcc2a1856ea583d38181b80c7440-5611x3741.jpg?rect=0,425,5611,2946&w=1200&h=630"
              alt={t.articleAlt}
              width={1200}
              height={630}
              className="aspect-[1200/630] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            />
            <div className="p-6">
              <p className="font-mono text-[10px] uppercase tracking-wide text-zinc-400">{t.articleMeta}</p>
              <h2 lang="en" className="mt-2 text-lg font-medium">
                The extracurricular that left Earth
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{t.articleSummary}</p>
              <p className="mt-4 text-xs text-zinc-400">
                {t.articleByline} <span className="text-zinc-200 group-hover:underline">{t.articleCta}</span>
              </p>
            </div>
          </a>
        </section>

        <section className="mt-32 border-t border-zinc-200 pt-12 text-sm sm:mt-40 dark:border-zinc-800">
          <h2 className="font-medium">{t.education}</h2>
          <ul className="mt-4 space-y-2 text-zinc-300">
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
        <p className="text-xs text-zinc-500">{t.privacy}</p>
      </footer>
    </div>
  );
}
