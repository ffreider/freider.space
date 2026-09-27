type Entry = {
  period: string;
  org: string;
  href?: string;
  role: string;
  description?: string;
};

const timeline: Entry[] = [
  {
    period: "2025 –",
    org: "Meso Manufacturing",
    role: "Co-founder",
    description:
      "Working on large-scale 3D printing of high-performance composite parts.",
  },
  {
    period: "2025 –",
    org: "NASA HUNCH Norge",
    href: "https://nasahunch.no",
    role: "Chair of the board",
  },
  {
    period: "2024 –",
    org: "NORSTEC Summit",
    href: "https://norstec.no/summit",
    role: "Co-founder and chair",
    description:
      "Norway's annual space conference. First held March 2026 in Trondheim.",
  },
  {
    period: "2024 –",
    org: "Spacepodden",
    href: "https://open.spotify.com/show/7ofO8qm8tRBk2llQEMK8JB",
    role: "Host",
    description: "A weekly Norwegian-language podcast about space. 68+ episodes.",
  },
  {
    period: "2024 –",
    org: "NORSTEC",
    href: "https://norstec.no",
    role: "Co-founder and President",
    description:
      "The Norwegian Space Technology Collective, an umbrella organization for 10 student space and rocketry organizations with 550+ members.",
  },
  {
    period: "2024 –",
    org: "Tekna Romfart",
    role: "Board member",
  },
  {
    period: "2023 – 2024",
    org: "Kongsberg Defence & Aerospace",
    role: "Summer intern (2024) and part-time project liaison (2023–24)",
  },
  {
    period: "2023",
    org: "KSAT",
    role: "Summer intern, Tromsø",
    description: "Satellite communication and orbital mechanics.",
  },
  {
    period: "2022",
    org: "NTNU",
    role: "Satellite operations intern",
  },
  {
    period: "2021 – 2026",
    org: "Orbit NTNU",
    role: "Program director, project manager and head of finance",
    description:
      "Led the student satellite program: SelfieSat, FramSat-1/1.5 and BioSat.",
  },
  {
    period: "2019 – 2020",
    org: "Norwegian Armed Forces",
    role: "Smoke diver and team leader",
    description: "NATO Joint Warfare Centre. Led a team of eight smoke divers.",
  },
];

const links = [{ label: "GitHub", href: "https://github.com/ffreider" }];

const linkClass =
  "underline decoration-zinc-300 underline-offset-4 hover:decoration-current dark:decoration-zinc-600";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-20 sm:py-28">
      <header className="flex flex-col items-center text-center">
        <div
          aria-hidden
          className="flex size-28 items-center justify-center rounded-full bg-zinc-200 text-3xl font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
        >
          FF
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Freider Fløan
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          I build things for the Norwegian space ecosystem.
        </p>
        <nav className="mt-4 flex gap-4 text-sm">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <ol className="mt-16 border-l border-zinc-200 dark:border-zinc-800">
        {timeline.map((entry) => (
          <li key={entry.org} className="relative pb-10 pl-6 last:pb-0">
            <span className="absolute -left-[5px] top-1.5 size-[9px] rounded-full border border-zinc-300 bg-background dark:border-zinc-600" />
            <p className="font-mono text-xs text-zinc-500">{entry.period}</p>
            <h2 className="mt-1 font-medium">
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
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {entry.description}
              </p>
            )}
          </li>
        ))}
      </ol>

      <section className="mt-16 border-t border-zinc-200 pt-8 text-sm dark:border-zinc-800">
        <h2 className="font-medium">Education</h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          MSc, Electronic Systems Design (space systems), NTNU. Expected 2028.
        </p>
      </section>
    </main>
  );
}
