import Image from "next/image";
import { Unbounded } from "next/font/google";
import { type Episode, latestEpisode } from "@/lib/spacepodden";
import { IssNow } from "./iss";

const display = Unbounded({ subsets: ["latin"], weight: "600" });

type YearMonth = [year: number, month: number];

type Entry = {
  start: YearMonth;
  end?: YearMonth; // omitted = ongoing
  org: string;
  short?: string; // label in the chart, when the full name is too long
  href?: string;
  role: string;
  description?: string;
};

// Newest first. Months are approximate where the exact month isn't known.
const timeline: Entry[] = [
  {
    start: [2025, 11],
    org: "Meso Manufacturing",
    href: "https://www.mesomanufacturing.com/",
    short: "Meso",
    role: "Co-founder",
    description:
      "Working on large-scale 3D printing of high-performance composite parts.",
  },
  {
    start: [2025, 8],
    org: "NASA HUNCH Norge",
    short: "NASA HUNCH",
    href: "https://nasahunch.no",
    role: "Chair of the board",
  },
  {
    start: [2024, 10],
    org: "Spacepodden",
    href: "https://open.spotify.com/show/7ofO8qm8tRBk2llQEMK8JB",
    role: "Host",
    description: "A weekly Norwegian-language podcast about space.",
  },
  {
    start: [2024, 9],
    org: "NORSTEC Summit",
    short: "Summit",
    href: "https://norstec.no/summit",
    role: "Co-founder and chair",
    description:
      "Norway's annual space conference. First held March 2026 in Trondheim.",
  },
  {
    start: [2024, 3],
    org: "Tekna Romfart",
    href: "https://www.tekna.no/fag-og-nettverk/samferdsel-og-infrastruktur/tekna-romfart/",
    role: "Board member",
  },
  {
    start: [2024, 2],
    org: "NORSTEC",
    href: "https://norstec.no",
    role: "Co-founder and President",
    description:
      "The Norwegian Space Technology Collective, an umbrella organization for 10 student space and rocketry organizations with 550+ members.",
  },
  {
    start: [2023, 10],
    end: [2024, 8],
    org: "Kongsberg Defence & Aerospace",
    href: "https://www.kongsberg.com/what-we-do/space/",
    short: "Kongsberg",
    role: "Project liaison, then summer intern",
  },
  {
    start: [2023, 6],
    end: [2023, 8],
    org: "KSAT",
    href: "https://www.ksat.no/",
    role: "Summer intern, Tromsø",
    description: "Satellite communication and orbital mechanics.",
  },
  {
    start: [2022, 6],
    end: [2022, 8],
    org: "NTNU",
    short: "NTNU intern",
    role: "Satellite operations intern",
  },
  {
    start: [2021, 8],
    end: [2026, 5],
    org: "Orbit NTNU",
    href: "https://orbitntnu.com/",
    role: "Program director, project manager and head of finance",
    description:
      "Led the student satellite program: SelfieSat, FramSat-1/1.5 and BioSat.",
  },
  {
    start: [2019, 7],
    end: [2020, 6],
    org: "Norwegian Armed Forces",
    short: "Military service",
    role: "Smoke diver and team leader",
    description: "NATO Joint Warfare Centre. Led a team of eight smoke divers.",
  },
];

const education = [
  "MSc, Electronic Systems Design (space systems), NTNU",
  "BSc, Economics and Business Administration, NTNU Business School",
];

const links = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/freider/" },
  { label: "GitHub", href: "https://github.com/ffreider" },
];

const FIRST_YEAR = 2019;
const LAST_YEAR = 2027;
const years = Array.from(
  { length: LAST_YEAR - FIRST_YEAR },
  (_, i) => FIRST_YEAR + i,
);

const toYears = ([year, month]: YearMonth) => year + (month - 1) / 12;
const today = new Date();
const now = today.getFullYear() + today.getMonth() / 12;

// Position on the chart as a percentage of its width.
const pct = (t: number) =>
  ((t - FIRST_YEAR) / (LAST_YEAR - FIRST_YEAR)) * 100;

const period = ({ start, end }: Entry) =>
  end
    ? start[0] === end[0]
      ? `${start[0]}`
      : `${start[0]} – ${end[0]}`
    : `${start[0]} – now`;

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

// Spacepodden's description gets its episode count from the live feed.
function describe(entry: Entry, episode: Episode | null) {
  if (entry.org === "Spacepodden" && episode?.number) {
    return `${entry.description} ${episode.number}+ episodes so far.`;
  }
  return entry.description;
}

function LatestEpisode({ episode }: { episode: Episode }) {
  const date = episode.published.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Oslo",
  });
  return (
    <a
      href={episode.url}
      className="mt-4 flex max-w-md items-center gap-4 rounded-xl border border-zinc-200 bg-background/60 p-3 backdrop-blur transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      {episode.image && (
        <Image
          src={episode.image}
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-md object-cover"
        />
      )}
      <span className="min-w-0">
        <span className="block font-mono text-[10px] uppercase tracking-wide text-zinc-500">
          Latest episode
          {episode.number && ` · E${episode.number}`} · {date}
          {episode.minutes && ` · ${episode.minutes} min`}
        </span>
        <span className="mt-1 line-clamp-2 block text-sm">{episode.title}</span>
      </span>
    </a>
  );
}

const linkClass =
  "underline decoration-zinc-300 underline-offset-4 hover:decoration-current dark:decoration-zinc-600";

// Every role as a line on a shared time axis, so overlaps are visible at a glance.
function ParallelChart({ episode }: { episode: Episode | null }) {
  const nowPct = pct(now);

  return (
    <figure aria-label="Timeline of roles running in parallel" className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {years.map((year) => (
          <div
            key={year}
            className="absolute inset-y-0 border-l border-zinc-100 dark:border-zinc-900"
            style={{ left: `${pct(year)}%` }}
          >
            <span className="absolute -bottom-6 left-1 font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
              ’{String(year).slice(2)}
            </span>
          </div>
        ))}
        <div
          className="absolute inset-y-0 border-l border-dashed border-zinc-300 dark:border-zinc-700"
          style={{ left: `${nowPct}%` }}
        >
          <span className="absolute -top-6 -translate-x-1/2 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
            now
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
              key={entry.org}
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
                  ongoing
                    ? "text-zinc-700 dark:text-zinc-200"
                    : "text-zinc-400 dark:text-zinc-500"
                } ${labelBefore ? "pr-2.5" : "pl-2.5"}`}
                style={
                  labelBefore
                    ? { right: `${100 - left}%` }
                    : { left: `${right}%` }
                }
              >
                {entry.short ?? entry.org}
              </span>

              {/* Details card on hover or keyboard focus. Full width on phones,
                  anchored to the line on larger screens. */}
              <div
                className={`pointer-events-none absolute inset-x-0 z-20 translate-y-1 rounded-lg border border-zinc-200 bg-background p-3 text-left opacity-0 shadow-xl transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100 sm:w-72 dark:border-zinc-800 ${
                  i >= timeline.length / 2 ? "bottom-full mb-1" : "top-full mt-1"
                } ${
                  labelBefore
                    ? "sm:left-auto sm:right-[var(--r)]"
                    : "sm:right-auto sm:left-[var(--l)]"
                }`}
                style={
                  {
                    "--l": `${left}%`,
                    "--r": `${100 - right}%`,
                  } as React.CSSProperties
                }
              >
                <p className="font-mono text-[10px] text-zinc-500">
                  {period(entry)}
                </p>
                <p className="mt-0.5 text-sm font-medium">{entry.org}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-300">
                  {entry.role}
                </p>
                {entry.description && (
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {describe(entry, episode)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

export const revalidate = 3600;

export default async function Home() {
  const episode = await latestEpisode();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-24 sm:px-8 sm:py-40">
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
        <h1 className={`${display.className} mt-8 text-3xl sm:text-4xl`}>
          Freider Fløan
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          I like starting things, mostly about space.
        </p>
        <nav className="mt-6 flex gap-6 text-sm">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <section className="mt-32 sm:mt-40">
        <ParallelChart episode={episode} />
      </section>

      <ol className="mt-32 space-y-12 sm:mt-40">
        {timeline.map((entry) => (
          <li key={entry.org} className="grid gap-x-6 sm:grid-cols-[7rem_1fr]">
            <p className="font-mono text-xs leading-6 text-zinc-500">
              {period(entry)}
            </p>
            <div>
              <h2 className="font-medium">
                {entry.href ? (
                  <a href={entry.href} className={linkClass}>
                    {entry.org}
                  </a>
                ) : (
                  entry.org
                )}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {entry.role}
              </p>
              {entry.description && (
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {describe(entry, episode)}
                </p>
              )}
              {entry.org === "Spacepodden" && episode && (
                <LatestEpisode episode={episode} />
              )}
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-32 border-t border-zinc-200 pt-12 text-sm sm:mt-40 dark:border-zinc-800">
        <h2 className="font-medium">Education</h2>
        <ul className="mt-4 space-y-2 text-zinc-500 dark:text-zinc-400">
          {education.map((degree) => (
            <li key={degree}>{degree}. Finishing soon ish.</li>
          ))}
        </ul>
      </section>

      <footer className="mt-24">
        <IssNow />
      </footer>
    </main>
  );
}
