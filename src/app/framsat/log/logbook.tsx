import Link from "next/link";
import { observationUrl, receptionLog, type LogEntry } from "@/lib/satnogs-log";
import { LAUNCH, stampOf } from "@/lib/stamp";
import { LOCALE, type Lang, numbers } from "../../i18n";
import { loadCountries, placeName } from "../../place-name";

// The logbook (/framsat/log and /no/framsat/log): every good SatNOGS reception
// of FramSat-1 since launch, newest first and grouped by UTC day, in the
// tracker's light design. Times are UTC, like SatNOGS and the postcards,
// because the stations are all over the world.

const TEXT = {
  en: {
    title: "FramSat-1 logbook",
    intro:
      "Every time a SatNOGS ground station heard FramSat-1 since it was launched on 5 September 2026. Radio amateurs around the world run these stations; each line is one pass one of them recorded.",
    receptions: "receptions",
    stations: "stations",
    countries: "countries",
    days: "days in orbit",
    perDay: (n: string) => `${n} ${n === "1" ? "reception" : "receptions"}`,
    postcard: "Postcard",
    waterfallAlt: (station: string) => `Waterfall of FramSat-1's signal, received by ${station}`,
    incomplete: "Some days couldn't be loaded from SatNOGS just now, so a few receptions may be missing.",
    empty: "SatNOGS couldn't be reached just now. Try again in a few minutes.",
    tracker: "FramSat-1 live tracker",
    credit: "Receptions and waterfalls from the SatNOGS Network (CC BY-SA 4.0). Updated every 15 minutes.",
    other: { label: "Norsk", href: "/no/framsat/log", lang: "nb" },
    home: "/",
    trackerHref: "/framsat",
  },
  no: {
    title: "Loggbok for FramSat-1",
    intro:
      "Hver gang en SatNOGS-bakkestasjon har hørt FramSat-1 siden oppskytingen 5. september 2026. Radioamatører over hele verden driver stasjonene; hver linje er én passering en av dem tok opp.",
    receptions: "mottak",
    stations: "stasjoner",
    countries: "land",
    days: "dager i bane",
    perDay: (n: string) => `${n} mottak`,
    postcard: "Postkort",
    waterfallAlt: (station: string) => `Vannfallsdiagram av signalet fra FramSat-1, tatt opp av ${station}`,
    incomplete: "Noen dager kunne ikke hentes fra SatNOGS akkurat nå, så noen mottak kan mangle.",
    empty: "Fikk ikke kontakt med SatNOGS akkurat nå. Prøv igjen om noen minutter.",
    tracker: "FramSat-1 direkte",
    credit: "Mottak og vannfallsdiagrammer fra SatNOGS Network (CC BY-SA 4.0). Oppdateres hvert kvarter.",
    other: { label: "English", href: "/framsat/log", lang: "en" },
    home: "/no",
    trackerHref: "/no/framsat",
  },
};

const linkClass = "underline decoration-fg-4 underline-offset-4 hover:decoration-accent";

export async function Logbook({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const n = numbers(lang);
  const [{ entries, complete, asOf }, countries] = await Promise.all([receptionLog(), loadCountries()]);
  const country = (e: LogEntry) => (Number.isFinite(e.lat) ? placeName(countries, e.lat, e.lon, lang) : "");

  const named = entries.map((e) => ({ ...e, country: country(e) }));
  const totals = [
    [n.whole(entries.length), t.receptions],
    [n.whole(new Set(entries.map((e) => e.stationId)).size), t.stations],
    [n.whole(new Set(named.map((e) => e.country).filter(Boolean)).size), t.countries],
    [n.whole(Math.floor((asOf - LAUNCH) / 86_400_000)), t.days],
  ];

  const days = new Map<string, typeof named>();
  for (const e of named) {
    const key = e.start.slice(0, 10);
    days.set(key, [...(days.get(key) ?? []), e]);
  }
  const dayName = (key: string) =>
    new Date(`${key}T12:00:00Z`).toLocaleDateString(LOCALE[lang], {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

  return (
    <div lang={lang === "no" ? "nb" : "en"} className="contents">
      <nav className="flex w-full items-baseline justify-between px-6 pt-6 text-sm sm:px-8">
        <a href={t.home} className="display text-base">
          Freider Fløan
        </a>
        <Link href={t.other.href} hrefLang={t.other.lang} lang={t.other.lang} className="text-fg-3 hover:text-fg">
          {t.other.label}
        </Link>
      </nav>

      <main className="mx-auto w-full max-w-3xl px-6 pb-16 pt-14 sm:px-8">
        <Link href={t.trackerHref} className={`text-sm text-fg-2 ${linkClass}`}>
          {t.tracker}
        </Link>
        <h1 className="display mt-4 text-5xl sm:text-6xl">{t.title}</h1>
        <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-fg-2">{t.intro}</p>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y-2 border-fg py-5 sm:grid-cols-4">
          {totals.map(([value, label]) => (
            <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd className="display text-3xl tabular-nums">{value}</dd>
              <dd className="text-xs text-fg-3">{label}</dd>
            </div>
          ))}
        </dl>

        {!complete && <p className="mt-4 text-sm text-accent">{entries.length ? t.incomplete : t.empty}</p>}

        {[...days].map(([key, list]) => (
          <section key={key} className="mt-10">
            <h2 className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
              <span className="text-lg font-semibold first-letter:uppercase">{dayName(key)}</span>
              <span className="text-xs text-fg-3">{t.perDay(n.whole(list.length))}</span>
            </h2>
            <ul>
              {list.map((e) => (
                <li
                  key={e.id}
                  className="grid grid-cols-[120px_1fr_auto] items-center gap-x-4 gap-y-1 border-b border-line py-3 sm:grid-cols-[120px_4.5rem_1fr_3rem_auto]"
                >
                  <a href={observationUrl(e.id)} className="col-start-1 row-span-2 row-start-1 block sm:col-start-auto sm:row-span-1 sm:row-start-auto" aria-label={e.station}>
                    {e.waterfall ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/framsat/log/waterfall/${e.id}`}
                        width={120}
                        height={48}
                        loading="lazy"
                        decoding="async"
                        alt={t.waterfallAlt(e.station)}
                        className="block h-12 w-[120px] rounded-card bg-fg object-cover"
                      />
                    ) : (
                      <span className="block h-12 w-[120px] rounded-card bg-line" />
                    )}
                  </a>
                  <span className="col-start-2 row-start-2 font-mono text-xs tabular-nums text-fg-3 sm:col-start-auto sm:row-start-auto">
                    {e.start.slice(11, 16)} UTC
                  </span>
                  <span className="col-start-2 row-start-1 min-w-0 sm:col-start-auto sm:row-start-auto">
                    <a href={observationUrl(e.id)} className={`text-sm text-fg ${linkClass}`}>
                      {e.station}
                    </a>
                    {e.country && <span className="block truncate text-xs text-fg-3">{e.country}</span>}
                  </span>
                  <span className="col-start-3 row-start-1 text-right font-mono text-xs tabular-nums text-fg-2 sm:col-start-auto sm:row-start-auto">
                    {Number.isFinite(e.maxElevation) ? `${e.maxElevation.toFixed(0)}°` : ""}
                  </span>
                  <Link
                    href={`/postcard/${stampOf(new Date(e.start))}`}
                    className={`col-start-3 row-start-2 text-right text-xs text-fg-2 sm:col-start-auto sm:row-start-auto ${linkClass}`}
                  >
                    {t.postcard}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-10 text-xs leading-relaxed text-fg-4">{t.credit}</p>
      </main>
    </div>
  );
}
