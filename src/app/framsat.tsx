"use client";

import { useEffect, useMemo, useState } from "react";
import { twoline2satrec } from "satellite.js";
import type { Tle } from "@/lib/framsat-tle";
import type { Reception } from "@/lib/satnogs";
import {
  dopplerHz,
  DOWNLINK_HZ,
  LAUNCH,
  orbitFacts,
  type Pass,
  type SatState,
  stateAt,
  TRONDHEIM,
  upcomingPasses,
} from "./framsat-orbit";
import { type Lang, LOCALE, numbers } from "./i18n";
import { goLive, setOffset, setSpeed, simNow, useSimClock } from "./sim-time";
import { segments, TLE_FIELDS } from "./tle-fields";

export { TRONDHEIM };
export type { SatState };

// A state plus the real time it was computed at, so the offset of the
// simulated clock can be shown without reading the clock during render.
export type SatTick = SatState & { real: number };

// FramSat-1's state at the (possibly time-travelling) simulated time,
// recalculated in the browser from its TLE with the SGP4 orbit model: every
// second normally, ten times a second while fast-forwarding.
export function useFramsat(tle: Tle) {
  const satrec = useMemo(() => twoline2satrec(tle.line1, tle.line2), [tle]);
  const { version, speed } = useSimClock();
  const [state, setState] = useState<SatTick | null>(null);

  useEffect(() => {
    const update = () => {
      const s = stateAt(satrec, new Date(simNow()));
      setState(s ? { ...s, real: Date.now() } : null);
    };
    update();
    const timer = setInterval(update, speed === 1 ? 1000 : 100);
    return () => clearInterval(timer);
  }, [satrec, version, speed]);

  return state;
}

// ————— Text —————

const T = {
  en: {
    live: "Live from orbit",
    intro:
      "A student satellite I worked on at Orbit NTNU, in orbit since 5 September 2026. Everything here is computed in your browser from its orbital elements with the SGP4 model.",
    hint: "Drag the globe to spin it. Scrub or fast-forward time to watch it orbit.",
    now: "Live",
    localTime: "Oslo time",
    backToNow: "Back to now",
    timeAria: "Time travel, in minutes from now",
    speedAria: "Playback speed",
    hours: "h",
    underMinute: "under a minute",
    tomorrow: "tomorrow",
    ago: (d: string) => `${d} ago`,
    in: (d: string) => `in ${d}`,
    tabs: { overview: "Overview", telemetry: "Telemetry", passes: "Passes", signals: "Signals", tle: "TLE" },
    tabsAria: "FramSat-1 data",
    compass: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
    compassLong: ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"],
    position: "Position",
    up: (lon: string, alt: string) => `${lon}, ${alt} km up`,
    fromTrondheim: "From Trondheim",
    alongGround: "along the ground",
    speed: "Speed",
    light: "Light",
    sunlight: "Sunlight",
    eclipse: "Eclipse",
    sunlightNote: "Solar panels in the Sun",
    eclipseNote: "In Earth’s shadow",
    overTrondheim: "Over Trondheim",
    overheadNow: "Overhead now",
    aboveHorizon: (n: string) => `${n}° above the horizon`,
    peaksAt: (n: string, when: string) => `peaks at ${n}°, ${when}`,
    noPass: "no pass in the next 3 days",
    sinceLaunch: "Since launch",
    orbits: (n: string) => `${n} orbits`,
    travelled: (km: string, days: number) => `${km} million km in ${days} days`,
    stateVector: "State vector · TEME frame",
    lookAngles: "Look angles from Trondheim",
    azimuth: "Azimuth",
    elevation: "Elevation",
    slantRange: "Slant range",
    rangeRate: "Range rate",
    radio: "Radio downlink",
    frequency: "Frequency",
    mode: "Mode",
    doppler: "Doppler",
    tuneTo: "Tune to",
    audible: "Above the horizon: a receiver in Trondheim could hear it now.",
    inaudible: "Below Trondheim’s horizon right now, so the shift is only theoretical.",
    frequencyPer: "Frequency per",
    passesIntro:
      "Passes over Trondheim that climb at least 5° above the horizon. Pick one to see its path across the sky.",
    noPasses: "No passes over Trondheim in the next three days.",
    rises: "rises",
    peaks: "peaks",
    sets: "sets",
    skyAria: (rise: string, peak: string, set: string) =>
      `Sky plot: rises in the ${rise}, peaks at ${peak}°, sets in the ${set}`,
    addToCalendar: "Add to calendar",
    icsSummary: "FramSat-1 over Trondheim",
    icsDescription: (rise: string, riseAt: string, peak: string, peakAt: string, set: string, setAt: string) =>
      `Rises in the ${rise} at ${riseAt}, peaks ${peak}° above the horizon at ${peakAt}, sets in the ${set} at ${setAt} (Oslo time). Downlink 435.141 MHz, FSK 9k6. Follow it live: https://freider.space/#framsat`,
    icsAlarm: "FramSat-1 rises in 10 minutes",
    signalsIntro:
      "Amateur radio ground stations in the SatNOGS network record FramSat-1’s signal as it passes over them. These are the latest good receptions, the cyan dots on the globe.",
    noSignals: "No recent receptions to show right now.",
    lastHeard: (ago: string, station: string) => `Last heard ${ago} by ${station}`,
    showWaterfall: "Show waterfall",
    waterfallNote: "Loads a 1–2 MB image from SatNOGS.",
    waterfallCaption:
      "The curve is FramSat-1’s signal sliding in frequency as it passes overhead: the Doppler effect. The short horizontal dashes are bursts of data.",
    waterfallAlt: (station: string) => `Waterfall of FramSat-1’s signal received by ${station}`,
    openOnSatnogs: "Open on SatNOGS ↗",
    tleIntro: "The raw two-line element set everything here is computed from. Hover or tab through the fields.",
    tlePoint: "Point at a field to see what it means.",
    tleLocation: (line: number, cols: string) => `Line ${line}, columns ${cols}`,
    derived: "Derived",
    semiMajor: "Semi-major axis",
    perigeeApogee: "Perigee / apogee",
    period: "Period",
    elementsAge: "Elements age",
    days: "days",
  },
  no: {
    live: "Direkte fra bane",
    intro:
      "En studentsatellitt jeg jobbet med i Orbit NTNU, i bane siden 5. september 2026. Alt her beregnes i nettleseren din fra baneelementene med SGP4-modellen.",
    hint: "Dra i jordkloden for å snurre den. Spol i tid for å se den gå i bane.",
    now: "Direkte",
    localTime: "norsk tid",
    backToNow: "Tilbake til nå",
    timeAria: "Tidsreise, i minutter fra nå",
    speedAria: "Avspillingshastighet",
    hours: "t",
    underMinute: "under ett minutt",
    tomorrow: "i morgen",
    ago: (d: string) => `for ${d} siden`,
    in: (d: string) => `om ${d}`,
    tabs: { overview: "Oversikt", telemetry: "Telemetri", passes: "Passeringer", signals: "Signaler", tle: "TLE" },
    tabsAria: "Data om FramSat-1",
    compass: ["N", "NØ", "Ø", "SØ", "S", "SV", "V", "NV"],
    compassLong: ["nord", "nordøst", "øst", "sørøst", "sør", "sørvest", "vest", "nordvest"],
    position: "Posisjon",
    up: (lon: string, alt: string) => `${lon}, ${alt} km over bakken`,
    fromTrondheim: "Fra Trondheim",
    alongGround: "langs bakken",
    speed: "Fart",
    light: "Lys",
    sunlight: "Sollys",
    eclipse: "Skygge",
    sunlightNote: "Solcellepanelene er i sola",
    eclipseNote: "I jordskyggen",
    overTrondheim: "Over Trondheim",
    overheadNow: "Over horisonten nå",
    aboveHorizon: (n: string) => `${n}° over horisonten`,
    peaksAt: (n: string, when: string) => `høyest ${n}°, ${when}`,
    noPass: "ingen passering de neste 3 dagene",
    sinceLaunch: "Siden oppskyting",
    orbits: (n: string) => `${n} runder`,
    travelled: (km: string, days: number) => `${km} millioner km på ${days} dager`,
    stateVector: "Tilstandsvektor · TEME-ramme",
    lookAngles: "Retning fra Trondheim",
    azimuth: "Asimut",
    elevation: "Elevasjon",
    slantRange: "Avstand",
    rangeRate: "Radiell fart",
    radio: "Radio, nedlink",
    frequency: "Frekvens",
    mode: "Modulasjon",
    doppler: "Doppler",
    tuneTo: "Still inn på",
    audible: "Over horisonten: en mottaker i Trondheim kan høre den nå.",
    inaudible: "Under horisonten i Trondheim akkurat nå, så skiftet er bare teoretisk.",
    frequencyPer: "Frekvens fra",
    passesIntro:
      "Passeringer over Trondheim som når minst 5° over horisonten. Velg en for å se banen over himmelen.",
    noPasses: "Ingen passeringer over Trondheim de neste tre dagene.",
    rises: "opp",
    peaks: "høyest",
    sets: "ned",
    skyAria: (rise: string, peak: string, set: string) =>
      `Himmelkart: kommer opp i ${rise}, høyest ${peak}°, går ned i ${set}`,
    addToCalendar: "Legg til i kalenderen",
    icsSummary: "FramSat-1 over Trondheim",
    icsDescription: (rise: string, riseAt: string, peak: string, peakAt: string, set: string, setAt: string) =>
      `Kommer opp i ${rise} kl. ${riseAt}, er høyest ${peak}° over horisonten kl. ${peakAt} og går ned i ${set} kl. ${setAt}. Nedlink 435,141 MHz, FSK 9k6. Følg den direkte: https://freider.space/no#framsat`,
    icsAlarm: "FramSat-1 kommer over horisonten om 10 minutter",
    signalsIntro:
      "Amatørradiostasjoner i SatNOGS-nettverket tar opp signalet fra FramSat-1 når den passerer over dem. Dette er de siste gode mottakene, de turkise prikkene på jordkloden.",
    noSignals: "Ingen nylige mottak å vise akkurat nå.",
    lastHeard: (ago: string, station: string) => `Sist hørt ${ago} av ${station}`,
    showWaterfall: "Vis vannfallsdiagram",
    waterfallNote: "Laster et bilde på 1–2 MB fra SatNOGS.",
    waterfallCaption:
      "Kurven er signalet fra FramSat-1 som glir i frekvens mens den passerer over: dopplereffekten. De korte vannrette strekene er datapakker.",
    waterfallAlt: (station: string) => `Vannfallsdiagram av signalet fra FramSat-1, tatt opp av ${station}`,
    openOnSatnogs: "Åpne i SatNOGS ↗",
    tleIntro: "Det rå baneelementsettet (TLE) som alt her er beregnet fra. Hold over eller tab gjennom feltene.",
    tlePoint: "Pek på et felt for å se hva det betyr.",
    tleLocation: (line: number, cols: string) => `Linje ${line}, kolonne ${cols}`,
    derived: "Avledet",
    semiMajor: "Store halvakse",
    perigeeApogee: "Perigeum / apogeum",
    period: "Omløpstid",
    elementsAge: "Alder på elementene",
    days: "dager",
  },
};

type Text = (typeof T)["en"];

// ————— Formatting —————

// Great-circle distance along the ground between two points, in km.
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

const direction = (az: number) => Math.round(az / 45) % 8;

// Formatting helpers for one language.
function format(lang: Lang) {
  const t = T[lang];
  const n = numbers(lang);
  const locale = LOCALE[lang];
  const osloDay = (d: Date) => d.toLocaleDateString(locale, { timeZone: "Europe/Oslo" });
  const clock = (d: Date) =>
    d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Oslo" });

  return {
    ...n,
    t,
    clock,
    coord: (value: number, pos: string, neg: string) =>
      `${n.fixed(Math.abs(value), 2)}° ${value >= 0 ? pos : neg}`,
    compass: (az: number) => t.compass[direction(az)],
    compassLong: (az: number) => t.compassLong[direction(az)],
    duration(ms: number) {
      const minutes = Math.max(0, Math.round(Math.abs(ms) / 60_000));
      if (minutes < 1) return t.underMinute;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      if (h >= 48) return `${Math.round(h / 24)} ${t.days}`;
      return h ? `${h} ${t.hours} ${m} min` : `${m} min`;
    },
    // "15:26", "tomorrow 04:12" or "Wed 1 Oct 04:12", relative to `now`.
    when(date: Date, now: number) {
      const time = clock(date);
      if (osloDay(date) === osloDay(new Date(now))) return time;
      if (osloDay(date) === osloDay(new Date(now + 86_400_000))) return `${t.tomorrow} ${time}`;
      const day = date.toLocaleDateString(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "Europe/Oslo",
      });
      return `${day} ${time}`;
    },
  };
}

type Format = ReturnType<typeof format>;

const linkClass = "underline decoration-zinc-600 underline-offset-4 hover:decoration-current";
const label = "font-mono text-[10px] uppercase tracking-wide text-zinc-400";

// ————— Time travel —————

const SPEEDS = [1, 60, 600];
const MIN_OFFSET = -12 * 60; // minutes
const MAX_OFFSET = 24 * 60;

function TimeControls({ tick, speed, f }: { tick: SatTick; speed: number; f: Format }) {
  const offset = tick.time - tick.real;
  const live = speed === 1 && Math.abs(offset) < 2000;
  const minutes = Math.round(offset / 60_000);

  return (
    <div className="mt-5 rounded-xl border border-zinc-800 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-xs tabular-nums">
          {live ? (
            <span className="text-emerald-300">● {f.t.now}</span>
          ) : (
            <span className="text-amber-200">
              {offset >= 0 ? "+" : "−"}
              {f.duration(offset)}
            </span>
          )}
          <span className="text-zinc-400">
            {" "}
            · {f.clock(new Date(tick.time))} {f.t.localTime}
          </span>
        </p>
        {!live && (
          <button
            type="button"
            onClick={goLive}
            className="font-mono text-[10px] uppercase tracking-wide text-zinc-300 hover:text-white"
          >
            {f.t.backToNow}
          </button>
        )}
      </div>
      <input
        type="range"
        aria-label={f.t.timeAria}
        min={MIN_OFFSET}
        max={MAX_OFFSET}
        step={1}
        value={Math.min(MAX_OFFSET, Math.max(MIN_OFFSET, minutes))}
        onChange={(e) => setOffset(Number(e.target.value) * 60_000)}
        className="mt-3 w-full accent-fuchsia-400"
      />
      <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-zinc-500">
        <span>−12 {f.t.hours}</span>
        <div className="flex gap-1" role="group" aria-label={f.t.speedAria}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              aria-pressed={speed === s}
              className={`rounded px-2 py-0.5 ${
                speed === s ? "bg-zinc-100 text-zinc-900" : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
        <span>+24 {f.t.hours}</span>
      </div>
    </div>
  );
}

// ————— Tabs —————

function Stat({ name, value, note }: { name: string; value: string; note?: string }) {
  return (
    <div>
      <dt className={label}>{name}</dt>
      <dd className="mt-1 font-mono text-sm tabular-nums text-foreground">{value}</dd>
      {note && <dd className="mt-0.5 text-xs leading-relaxed text-zinc-400">{note}</dd>}
    </div>
  );
}

function Rows({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div>
      <p className={label}>{title}</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs tabular-nums">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-zinc-400">{k}</dt>
            <dd className="text-right text-zinc-100">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Overview({
  tick,
  facts,
  next,
  f,
}: {
  tick: SatTick;
  facts: ReturnType<typeof orbitFacts>;
  next: Pass | undefined;
  f: Format;
}) {
  const { t } = f;
  const orbits =
    facts.revAtEpoch + (tick.time - facts.epoch.getTime()) / 60_000 / facts.periodMinutes;
  const travelledKm = orbits * 2 * Math.PI * facts.semiMajorAxisKm;
  const daysUp = Math.floor((tick.time - LAUNCH.getTime()) / 86_400_000);
  const overhead = tick.elevation > 0;
  const [n, s, e, w] = [t.compass[0], t.compass[4], t.compass[2], t.compass[6]];

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
      <Stat
        name={t.position}
        value={f.coord(tick.lat, n, s)}
        note={t.up(f.coord(tick.lon, e, w), f.whole(tick.altitude))}
      />
      <Stat
        name={t.fromTrondheim}
        value={`${f.whole(distanceKm(TRONDHEIM.lat, TRONDHEIM.lon, tick.lat, tick.lon))} km`}
        note={t.alongGround}
      />
      <Stat name={t.speed} value={`${f.whole(tick.speed)} km/h`} note={`${f.fixed(tick.speed / 3600, 2)} km/s`} />
      <Stat
        name={t.light}
        value={tick.sunlit ? t.sunlight : t.eclipse}
        note={tick.sunlit ? t.sunlightNote : t.eclipseNote}
      />
      <Stat
        name={t.overTrondheim}
        value={overhead ? t.overheadNow : next ? t.in(f.duration(next.start.getTime() - tick.time)) : "—"}
        note={
          overhead
            ? t.aboveHorizon(tick.elevation.toFixed(0))
            : next
              ? t.peaksAt(next.maxElevation.toFixed(0), f.when(next.peak, tick.time))
              : t.noPass
        }
      />
      <Stat
        name={t.sinceLaunch}
        value={t.orbits(f.whole(orbits))}
        note={t.travelled(f.fixed(travelledKm / 1e6, 1), daysUp)}
      />
    </dl>
  );
}

function Telemetry({ tick, f }: { tick: SatTick; f: Format }) {
  const { t } = f;
  const r = tick.position;
  const v = tick.velocity;
  const shift = dopplerHz(tick.rangeRate);
  return (
    <div className="space-y-5">
      <Rows
        title={t.stateVector}
        rows={[
          ["x", `${f.fixed(r.x, 1)} km`],
          ["y", `${f.fixed(r.y, 1)} km`],
          ["z", `${f.fixed(r.z, 1)} km`],
          ["|r|", `${f.fixed(Math.hypot(r.x, r.y, r.z), 1)} km`],
          ["vx", `${f.fixed(v.x, 3)} km/s`],
          ["vy", `${f.fixed(v.y, 3)} km/s`],
          ["vz", `${f.fixed(v.z, 3)} km/s`],
          ["|v|", `${f.fixed(Math.hypot(v.x, v.y, v.z), 3)} km/s`],
        ]}
      />
      <Rows
        title={t.lookAngles}
        rows={[
          [t.azimuth, `${f.fixed(tick.azimuth, 1)}° ${f.compass(tick.azimuth)}`],
          [t.elevation, `${f.signed(tick.elevation, 1)}°`],
          [t.slantRange, `${f.whole(tick.range)} km`],
          [t.rangeRate, `${f.signed(tick.rangeRate, 3)} km/s`],
        ]}
      />
      <div>
        <Rows
          title={t.radio}
          rows={[
            [t.frequency, `${f.fixed(DOWNLINK_HZ / 1e6, 3)} MHz`],
            [t.mode, "FSK 9k6 · AX.25 G3RUH"],
            [t.doppler, `${f.signed(shift / 1000, 2)} kHz`],
            [t.tuneTo, `${f.fixed((DOWNLINK_HZ + shift) / 1e6, 4)} MHz`],
          ]}
        />
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          {tick.elevation > 0 ? t.audible : t.inaudible} {t.frequencyPer}{" "}
          <a href="https://db.satnogs.org/satellite/BXJV-0815-0756-1233-1493" className={linkClass}>
            SatNOGS
          </a>
          .
        </p>
      </div>
    </div>
  );
}

// Where the satellite is in the sky: the centre is straight up, the rim is
// the horizon, north at the top.
function SkyPlot({ pass, tick, f }: { pass: Pass; tick: SatTick; f: Format }) {
  const point = ([az, el]: [number, number]) => {
    const r = (100 * (90 - el)) / 90;
    const a = (az * Math.PI) / 180;
    return [r * Math.sin(a), -r * Math.cos(a)] as const;
  };
  const first = pass.sky[0];
  const last = pass.sky[pass.sky.length - 1];
  const track = pass.sky.map((p) => point(p).join(",")).join(" ");
  const [sx, sy] = point(first);
  const [ex, ey] = point(last);
  const during =
    tick.time >= pass.start.getTime() && tick.time <= pass.end.getTime() && tick.elevation > 0;
  const [cx, cy] = point([tick.azimuth, Math.max(0, tick.elevation)]);
  const [n, e, s, w] = [0, 2, 4, 6].map((i) => f.t.compass[i]);

  return (
    <svg
      viewBox="-118 -118 236 236"
      className="mx-auto w-full max-w-[240px]"
      role="img"
      aria-label={f.t.skyAria(f.compassLong(first[0]), pass.maxElevation.toFixed(0), f.compassLong(last[0]))}
    >
      {[100, 66.7, 33.3].map((r) => (
        <circle key={r} r={r} fill="none" stroke="rgb(63 63 70)" strokeWidth={r === 100 ? 1 : 0.6} />
      ))}
      <path d="M0,-100V100M-100,0H100" stroke="rgb(63 63 70)" strokeWidth={0.6} />
      {(
        [
          [n, 0, -108],
          [e, 108, 0],
          [s, 0, 108],
          [w, -108, 0],
        ] as const
      ).map(([text, x, y]) => (
        <text key={text} x={x} y={y} fill="rgb(161 161 170)" fontSize={9} textAnchor="middle" dominantBaseline="middle" className="font-mono">
          {text}
        </text>
      ))}
      <text x={3} y={-69.7} fill="rgb(113 113 122)" fontSize={7} className="font-mono">30°</text>
      <text x={3} y={-36.3} fill="rgb(113 113 122)" fontSize={7} className="font-mono">60°</text>
      <polyline points={track} fill="none" stroke="#e879f9" strokeWidth={2} strokeLinecap="round" />
      <circle cx={sx} cy={sy} r={3.5} fill="#34d399" />
      <circle cx={ex} cy={ey} r={3.5} fill="#f87171" />
      {during && (
        <circle cx={cx} cy={cy} r={5} fill="#f0abfc" stroke="#030304" strokeWidth={1.5}>
          <animate attributeName="r" values="4;6;4" dur="1.6s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

// A calendar event for a pass, with a reminder 10 minutes before it rises.
function downloadIcs(pass: Pass, f: Format, lang: Lang) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const escape = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`);
  const first = pass.sky[0];
  const last = pass.sky[pass.sky.length - 1];
  const description = f.t.icsDescription(
    f.compassLong(first[0]),
    f.clock(pass.start),
    pass.maxElevation.toFixed(0),
    f.clock(pass.peak),
    f.compassLong(last[0]),
    f.clock(pass.end),
  );
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//freider.space//FramSat-1//EN",
    "BEGIN:VEVENT",
    `UID:framsat-1-${stamp(pass.start)}@freider.space`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(pass.start)}`,
    `DTEND:${stamp(pass.end)}`,
    `SUMMARY:${escape(f.t.icsSummary)}`,
    `DESCRIPTION:${escape(description)}`,
    "LOCATION:Trondheim",
    `URL:https://freider.space${lang === "no" ? "/no" : "/"}#framsat`,
    "BEGIN:VALARM",
    "TRIGGER:-PT10M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(f.t.icsAlarm)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `framsat-1-${stamp(pass.start).slice(0, 13)}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function Passes({ passes, tick, f, lang }: { passes: Pass[]; tick: SatTick; f: Format; lang: Lang }) {
  const { t } = f;
  const [selected, setSelected] = useState(0);
  if (!passes.length) return <p className="text-sm text-zinc-300">{t.noPasses}</p>;
  const pass = passes[Math.min(selected, passes.length - 1)];
  const first = pass.sky[0];
  const last = pass.sky[pass.sky.length - 1];

  return (
    <div>
      <p className="text-xs leading-relaxed text-zinc-400">{t.passesIntro}</p>
      <ul className="mt-3 space-y-1">
        {passes.map((p, i) => (
          <li key={p.start.getTime()}>
            <button
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={i === selected}
              className={`grid w-full grid-cols-[1fr_auto_auto] gap-3 rounded-md px-2 py-1.5 text-left font-mono text-xs tabular-nums ${
                i === selected ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              <span>{f.when(p.start, tick.time)}</span>
              <span className="text-zinc-400">{Math.round((p.end.getTime() - p.start.getTime()) / 60_000)} min</span>
              <span>{p.maxElevation.toFixed(0)}°</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <SkyPlot pass={pass} tick={tick} f={f} />
        <p className="mt-2 text-center font-mono text-[10px] text-zinc-400">
          <span className="text-emerald-300">●</span> {t.rises} {f.compass(first[0])} {f.clock(pass.start)} ·{" "}
          {t.peaks} {pass.maxElevation.toFixed(0)}° {f.clock(pass.peak)} ·{" "}
          <span className="text-red-400">●</span> {t.sets} {f.compass(last[0])} {f.clock(pass.end)}
        </p>
        <button
          type="button"
          onClick={() => downloadIcs(pass, f, lang)}
          className="mx-auto mt-3 flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1.5 font-mono text-[11px] text-zinc-200 hover:border-zinc-500"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <rect x="2" y="3" width="12" height="11" rx="1.5" />
            <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
          </svg>
          {t.addToCalendar}
        </button>
      </div>
    </div>
  );
}

function Signals({ receptions, tick, f }: { receptions: Reception[]; tick: SatTick; f: Format }) {
  const { t } = f;
  const [selected, setSelected] = useState(0);
  const [showing, setShowing] = useState<number | null>(null);
  if (!receptions.length) return <p className="text-sm text-zinc-300">{t.noSignals}</p>;
  const pick = receptions[Math.min(selected, receptions.length - 1)];
  const ago = (iso: string) => t.ago(f.duration(tick.real - new Date(iso).getTime()));

  return (
    <div>
      <p className="text-xs leading-relaxed text-zinc-400">{t.signalsIntro}</p>
      <p className="mt-3 font-mono text-xs text-cyan-200">
        {t.lastHeard(ago(receptions[0].start), receptions[0].station)}
      </p>
      <ul className="mt-3 space-y-1">
        {receptions.map((r, i) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={i === selected}
              className={`grid w-full grid-cols-[1fr_auto_auto] gap-3 rounded-md px-2 py-1.5 text-left font-mono text-xs tabular-nums ${
                i === selected ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              <span className="truncate">{r.station}</span>
              <span className="text-zinc-400">{ago(r.start)}</span>
              <span>{Number.isFinite(r.maxElevation) ? `${r.maxElevation.toFixed(0)}°` : ""}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        {pick.waterfall && showing === pick.id ? (
          <figure>
            {/* Loaded straight from SatNOGS, only when asked for. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pick.waterfall}
              alt={t.waterfallAlt(pick.station)}
              className="max-h-[420px] w-full rounded-lg object-cover object-top"
            />
            <figcaption className="mt-2 text-xs leading-relaxed text-zinc-400">{t.waterfallCaption}</figcaption>
          </figure>
        ) : (
          pick.waterfall && (
            <button
              type="button"
              onClick={() => setShowing(pick.id)}
              className="w-full rounded-lg border border-dashed border-zinc-700 px-3 py-4 text-center font-mono text-xs text-zinc-200 hover:border-zinc-500"
            >
              {t.showWaterfall}
              <span className="mt-1 block text-[10px] text-zinc-500">{t.waterfallNote}</span>
            </button>
          )
        )}
        <a href={pick.url} className={`mt-3 inline-block font-mono text-[11px] text-zinc-300 ${linkClass}`}>
          {t.openOnSatnogs}
        </a>
      </div>
    </div>
  );
}

function TleView({
  tle,
  facts,
  tick,
  f,
  lang,
}: {
  tle: Tle;
  facts: ReturnType<typeof orbitFacts>;
  tick: SatTick;
  f: Format;
  lang: Lang;
}) {
  const { t } = f;
  const [active, setActive] = useState<number | null>(null);
  const field = active === null ? null : TLE_FIELDS[active];
  const lines = { 1: tle.line1, 2: tle.line2 } as const;
  const ageHours = (tick.time - facts.epoch.getTime()) / 3_600_000;

  return (
    <div>
      <p className="text-xs leading-relaxed text-zinc-400">{t.tleIntro}</p>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-black/60 p-3 font-mono text-[10.5px] leading-5 text-zinc-500">
        {([1, 2] as const).map((n) => (
          <div key={n}>
            {segments(lines[n], n).map((seg, i) =>
              seg.field === undefined ? (
                <span key={i}>{seg.text}</span>
              ) : (
                <span
                  key={i}
                  tabIndex={0}
                  onMouseEnter={() => setActive(seg.field!)}
                  onFocus={() => setActive(seg.field!)}
                  className={`cursor-help rounded-sm outline-none ${
                    active === seg.field ? "bg-fuchsia-400/25 text-fuchsia-100" : "text-zinc-200 hover:text-white"
                  }`}
                >
                  {seg.text}
                </span>
              ),
            )}
          </div>
        ))}
      </pre>
      <div className="mt-3 min-h-[4.5rem] rounded-lg border border-zinc-800 p-3" aria-live="polite">
        {field ? (
          <>
            <p className={label}>
              {t.tleLocation(field.line, field.to !== field.from ? `${field.from}–${field.to}` : `${field.from}`)} ·{" "}
              {field.name[lang]}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-200">
              {field.explain(lines[field.line].slice(field.from - 1, field.to), lang)}
            </p>
          </>
        ) : (
          <p className="text-xs text-zinc-500">{t.tlePoint}</p>
        )}
      </div>
      <div className="mt-5">
        <Rows
          title={t.derived}
          rows={[
            [t.semiMajor, `${f.whole(facts.semiMajorAxisKm)} km`],
            [t.perigeeApogee, `${f.whole(facts.perigeeKm)} / ${f.whole(facts.apogeeKm)} km`],
            [t.period, `${f.fixed(facts.periodMinutes, 2)} min`],
            [
              t.elementsAge,
              ageHours < 48 ? `${f.fixed(ageHours, 1)} ${t.hours}` : `${f.fixed(ageHours / 24, 1)} ${t.days}`,
            ],
          ]}
        />
      </div>
    </div>
  );
}

// ————— The section —————

const TAB_IDS = ["overview", "telemetry", "passes", "signals", "tle"] as const;
type TabId = (typeof TAB_IDS)[number];

// The finale: a full-screen section where the background globe opens up into
// the whole Earth (see backdrop.tsx, which looks for #framsat), with the live
// numbers in a panel beside it.
export function FramsatSection({
  tle,
  receptions,
  lang,
}: {
  tle: Tle;
  receptions: Reception[];
  lang: Lang;
}) {
  const satrec = useMemo(() => twoline2satrec(tle.line1, tle.line2), [tle]);
  const facts = useMemo(() => orbitFacts(satrec, tle.line2), [satrec, tle]);
  const f = useMemo(() => format(lang), [lang]);
  const tick = useFramsat(tle);
  const { speed } = useSimClock();
  const [tab, setTab] = useState<TabId>("overview");
  const t: Text = f.t;

  // Upcoming passes, recomputed every 5 simulated minutes.
  const bucket = tick ? Math.floor(tick.time / 300_000) : null;
  const passes = useMemo(
    () => (bucket === null ? [] : upcomingPasses(satrec, new Date(bucket * 300_000), 6)),
    [satrec, bucket],
  );
  const ahead = tick ? passes.filter((p) => p.end.getTime() >= tick.time) : [];

  return (
    <section
      id="framsat"
      className="relative flex min-h-screen w-full flex-col justify-end px-6 pb-16 pt-[calc(88vmin+72px)] sm:px-8 lg:flex-row lg:items-center lg:justify-end lg:py-16 lg:pr-16"
    >
      <aside className="w-full max-w-md rounded-2xl border border-zinc-800 bg-background/85 p-6 lg:w-[440px] lg:max-w-none">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-fuchsia-300">
          <span className="relative size-2">
            <span className="absolute inset-0 rounded-full bg-fuchsia-400 motion-safe:animate-ping" />
            <span className="absolute inset-0 rounded-full bg-fuchsia-400" />
          </span>
          {t.live}
        </p>
        <h2 className="mt-3 text-xl font-medium">
          <a href="https://orbitntnu.com/projects/FramSat-1" className={linkClass}>
            FramSat-1
          </a>
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{t.intro}</p>
        <p className="mt-2 hidden text-xs text-zinc-400 [@media(pointer:fine)]:block">{t.hint}</p>

        {tick && <TimeControls tick={tick} speed={speed} f={f} />}

        <div
          role="tablist"
          aria-label={t.tabsAria}
          className="mt-5 flex gap-0.5 overflow-x-auto border-b border-zinc-800 [scrollbar-width:none]"
        >
          {TAB_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px shrink-0 border-b-2 px-2 py-2 font-mono text-[11px] uppercase tracking-wide ${
                tab === id
                  ? "border-fuchsia-400 text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t.tabs[id]}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="mt-5 min-h-[18rem]">
          {tick && tab === "overview" && <Overview tick={tick} facts={facts} next={ahead[0]} f={f} />}
          {tick && tab === "telemetry" && <Telemetry tick={tick} f={f} />}
          {tick && tab === "passes" && <Passes passes={ahead} tick={tick} f={f} lang={lang} />}
          {tick && tab === "signals" && <Signals receptions={receptions} tick={tick} f={f} />}
          {tick && tab === "tle" && <TleView tle={tle} facts={facts} tick={tick} f={f} lang={lang} />}
        </div>
      </aside>
    </section>
  );
}
