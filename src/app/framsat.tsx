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
import { placeName, useCountries } from "./place";
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
    introBefore: "A student satellite I worked on at ",
    introAfter: ", launched on 5 September 2026.",
    footnote:
      "Everything here is computed in your browser from FramSat-1’s orbital elements with the SGP4 model. Drag the globe to spin it, or move the slider to travel in time.",
    now: "Live",
    localTime: "Oslo time",
    backToNow: "Back to now",
    timeAria: "Time travel, in minutes from now",
    speedAria: "Playback speed",
    hours: "h",
    underMinute: "under a minute",
    tomorrow: "tomorrow",
    ago: (d: string) => `${d} ago`,
    tabs: { overview: "Overview", telemetry: "Telemetry", passes: "Passes", signals: "Signals", tle: "TLE" },
    tabsAria: "FramSat-1 data",
    compass: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
    compassLong: ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"],
    latitude: "Latitude",
    longitude: "Longitude",
    altitude: "Altitude",
    kmh: "km/h",
    summary: (alt: string, place: string, speed: string, sunlit: boolean) =>
      `Right now it’s ${alt} km above ${place}, moving at ${speed} km/h ${sunlit ? "in sunlight" : "in Earth’s shadow"}.`,
    overhead: (el: string) => `It’s above Trondheim’s horizon right now, ${el}° up.`,
    nextPass: (inTime: string, el: string, when: string) =>
      `It passes over Trondheim in ${inTime}, reaching ${el}° above the horizon ${when}.`,
    noPass: "It won’t pass over Trondheim in the next three days.",
    fromTrondheim: "From Trondheim",
    speed: "Speed",
    sinceLaunch: "Since launch",
    orbits: (n: string) => `${n} orbits`,
    travelled: "Travelled",
    travelledValue: (km: string, days: number) => `${km} million km in ${days} days`,
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
      "Amateur radio ground stations in the SatNOGS network record FramSat-1’s signal as it passes over them. These are the latest good receptions, marked as small dots on the globe.",
    noSignals: "No recent receptions to show right now.",
    lastHeard: (ago: string, station: string) => `Last heard ${ago} by ${station}`,
    showWaterfall: "Show waterfall",
    waterfallNote: "Loads a 1 to 2 MB image from SatNOGS.",
    waterfallCaption:
      "The curve is FramSat-1’s signal sliding in frequency as it passes overhead: the Doppler effect. The short horizontal dashes are bursts of data.",
    waterfallAlt: (station: string) => `Waterfall of FramSat-1’s signal received by ${station}`,
    openOnSatnogs: "Open on SatNOGS",
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
    introBefore: "En studentsatellitt jeg jobbet med i ",
    introAfter: ", skutt opp 5. september 2026.",
    footnote:
      "Alt her beregnes i nettleseren din fra baneelementene til FramSat-1 med SGP4-modellen. Dra i jordkloden for å snurre den, eller flytt glidebryteren for å reise i tid.",
    now: "Direkte",
    localTime: "norsk tid",
    backToNow: "Tilbake til nå",
    timeAria: "Tidsreise, i minutter fra nå",
    speedAria: "Avspillingshastighet",
    hours: "t",
    underMinute: "under ett minutt",
    tomorrow: "i morgen",
    ago: (d: string) => `for ${d} siden`,
    tabs: { overview: "Oversikt", telemetry: "Telemetri", passes: "Passeringer", signals: "Signaler", tle: "TLE" },
    tabsAria: "Data om FramSat-1",
    compass: ["N", "NØ", "Ø", "SØ", "S", "SV", "V", "NV"],
    compassLong: ["nord", "nordøst", "øst", "sørøst", "sør", "sørvest", "vest", "nordvest"],
    latitude: "Breddegrad",
    longitude: "Lengdegrad",
    altitude: "Høyde",
    kmh: "km/t",
    summary: (alt: string, place: string, speed: string, sunlit: boolean) =>
      `Akkurat nå er den ${alt} km over ${place}, i ${speed} km/t ${sunlit ? "i sollys" : "i jordskyggen"}.`,
    overhead: (el: string) => `Den er over horisonten i Trondheim akkurat nå, ${el}° opp.`,
    nextPass: (inTime: string, el: string, when: string) =>
      `Den passerer over Trondheim om ${inTime} og når ${el}° over horisonten ${when}.`,
    noPass: "Den passerer ikke over Trondheim de neste tre dagene.",
    fromTrondheim: "Fra Trondheim",
    speed: "Fart",
    sinceLaunch: "Siden oppskyting",
    orbits: (n: string) => `${n} runder`,
    travelled: "Tilbakelagt",
    travelledValue: (km: string, days: number) => `${km} millioner km på ${days} dager`,
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
      "Amatørradiostasjoner i SatNOGS-nettverket tar opp signalet fra FramSat-1 når den passerer over dem. Dette er de siste gode mottakene, merket som små prikker på jordkloden.",
    noSignals: "Ingen nylige mottak å vise akkurat nå.",
    lastHeard: (ago: string, station: string) => `Sist hørt ${ago} av ${station}`,
    showWaterfall: "Vis vannfallsdiagram",
    waterfallNote: "Laster et bilde på 1 til 2 MB fra SatNOGS.",
    waterfallCaption:
      "Kurven er signalet fra FramSat-1 som glir i frekvens mens den passerer over: dopplereffekten. De korte vannrette strekene er datapakker.",
    waterfallAlt: (station: string) => `Vannfallsdiagram av signalet fra FramSat-1, tatt opp av ${station}`,
    openOnSatnogs: "Åpne i SatNOGS",
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
      if (!h) return `${m} min`;
      return m ? `${h} ${t.hours} ${m} min` : `${h} ${t.hours}`;
    },
    // "at 15:26", "tomorrow at 04:12" (English) or "kl. 15:26", "i morgen
    // kl. 04:12" (Norwegian), for use inside a sentence.
    whenPhrase(date: Date, now: number) {
      const at = lang === "en" ? `at ${clock(date)}` : `kl. ${clock(date)}`;
      if (osloDay(date) === osloDay(new Date(now))) return at;
      if (osloDay(date) === osloDay(new Date(now + 86_400_000))) return `${t.tomorrow} ${at}`;
      const day = date.toLocaleDateString(locale, { weekday: "long", timeZone: "Europe/Oslo" });
      return lang === "en" ? `on ${day} ${at}` : `på ${day} ${at}`;
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

const linkClass = "underline decoration-fg-4 underline-offset-4 hover:decoration-accent";
const label = "text-xs text-fg-3";

// ————— Time travel —————

const SPEEDS = [1, 60, 600];
const MIN_OFFSET = -12 * 60; // minutes
const MAX_OFFSET = 24 * 60;

function TimeControls({ tick, speed, f }: { tick: SatTick; speed: number; f: Format }) {
  const offset = tick.time - tick.real;
  const live = speed === 1 && Math.abs(offset) < 2000;
  const minutes = Math.round(offset / 60_000);

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="tabular-nums">
          <span className="font-mono text-2xl text-fg">{f.clock(new Date(tick.time))}</span>{" "}
          <span className="text-sm text-fg-3">
            {f.t.localTime}
            {live ? `, ${f.t.now.toLowerCase()}` : `, ${offset >= 0 ? "+" : "−"}${f.duration(offset)}`}
          </span>
        </p>
        {!live && (
          <button
            type="button"
            onClick={goLive}
            className="text-sm text-fg-2 underline decoration-accent underline-offset-4 hover:text-fg"
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
        className="mt-3 w-full accent-[var(--accent)]"
      />
      <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-fg-4">
        <span>−12 {f.t.hours}</span>
        <div className="flex gap-3" role="group" aria-label={f.t.speedAria}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              aria-pressed={speed === s}
              className={
                speed === s
                  ? "text-fg underline decoration-accent decoration-2 underline-offset-4"
                  : "text-fg-3 hover:text-fg"
              }
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

function Rows({ title, rows, className }: { title?: string; rows: [string, string][]; className?: string }) {
  return (
    <div className={className}>
      {title && <p className={`${label} mb-2`}>{title}</p>}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-[13px] tabular-nums">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-sans text-fg-3">{k}</dt>
            <dd className="text-right text-fg">{v}</dd>
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
  lang,
}: {
  tick: SatTick;
  facts: ReturnType<typeof orbitFacts>;
  next: Pass | undefined;
  f: Format;
  lang: Lang;
}) {
  const { t } = f;
  const countries = useCountries();
  const place = placeName(countries, tick.lat, tick.lon, lang);
  const orbits =
    facts.revAtEpoch + (tick.time - facts.epoch.getTime()) / 60_000 / facts.periodMinutes;
  const travelledKm = orbits * 2 * Math.PI * facts.semiMajorAxisKm;
  const daysUp = Math.floor((tick.time - LAUNCH.getTime()) / 86_400_000);
  const [n, s, e, w] = [t.compass[0], t.compass[4], t.compass[2], t.compass[6]];

  const pass =
    tick.elevation > 0
      ? t.overhead(tick.elevation.toFixed(0))
      : next
        ? t.nextPass(
            f.duration(next.start.getTime() - tick.time),
            next.maxElevation.toFixed(0),
            f.whenPhrase(next.peak, tick.time),
          )
        : t.noPass;

  return (
    <div>
      <p className="text-lg leading-snug text-fg">
        {t.summary(f.whole(tick.altitude), place, f.whole(tick.speed), tick.sunlit)} {pass}
      </p>
      <Rows
        className="mt-6"
        rows={[
          [t.latitude, f.coord(tick.lat, n, s)],
          [t.longitude, f.coord(tick.lon, e, w)],
          [t.altitude, `${f.whole(tick.altitude)} km`],
          [t.speed, `${f.whole(tick.speed)} ${t.kmh}`],
          [t.fromTrondheim, `${f.whole(distanceKm(TRONDHEIM.lat, TRONDHEIM.lon, tick.lat, tick.lon))} km`],
          [t.sinceLaunch, t.orbits(f.whole(orbits))],
          [t.travelled, t.travelledValue(f.fixed(travelledKm / 1e6, 1), daysUp)],
        ]}
      />
    </div>
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
        <p className="mt-2 text-xs leading-relaxed text-fg-3">
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
        <circle key={r} r={r} fill="none" stroke="var(--line)" strokeWidth={r === 100 ? 1 : 0.6} />
      ))}
      <path d="M0,-100V100M-100,0H100" stroke="var(--line)" strokeWidth={0.6} />
      {(
        [
          [n, 0, -108],
          [e, 108, 0],
          [s, 0, 108],
          [w, -108, 0],
        ] as const
      ).map(([text, x, y]) => (
        <text key={text} x={x} y={y} fill="var(--fg-3)" fontSize={9} textAnchor="middle" dominantBaseline="middle" className="font-mono">
          {text}
        </text>
      ))}
      <text x={3} y={-69.7} fill="var(--fg-4)" fontSize={7} className="font-mono">30°</text>
      <text x={3} y={-36.3} fill="var(--fg-4)" fontSize={7} className="font-mono">60°</text>
      <polyline points={track} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" />
      <circle cx={sx} cy={sy} r={3.5} fill="var(--accent)" />
      <circle cx={ex} cy={ey} r={3.5} fill="var(--bg)" stroke="var(--accent)" strokeWidth={1.5} />
      {during && (
        <circle cx={cx} cy={cy} r={5} fill="var(--fg)" stroke="var(--bg)" strokeWidth={1.5}>
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
  if (!passes.length) return <p className="text-sm text-fg-2">{t.noPasses}</p>;
  const pass = passes[Math.min(selected, passes.length - 1)];
  const first = pass.sky[0];
  const last = pass.sky[pass.sky.length - 1];

  return (
    <div>
      <p className="text-xs leading-relaxed text-fg-3">{t.passesIntro}</p>
      <ul className="mt-3 space-y-1">
        {passes.map((p, i) => (
          <li key={p.start.getTime()}>
            <button
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={i === selected}
              className={`grid w-full grid-cols-[1fr_auto_auto] gap-3 rounded-card px-2 py-1.5 text-left font-mono text-xs tabular-nums ${
                i === selected ? "bg-line text-fg" : "text-fg-2 hover:bg-line/50"
              }`}
            >
              <span>{f.when(p.start, tick.time)}</span>
              <span className="text-fg-3">{Math.round((p.end.getTime() - p.start.getTime()) / 60_000)} min</span>
              <span>{p.maxElevation.toFixed(0)}°</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <SkyPlot pass={pass} tick={tick} f={f} />
        <p className="mt-2 text-center font-mono text-[10px] text-fg-3">
          {t.rises} {f.compass(first[0])} {f.clock(pass.start)}, {t.peaks} {pass.maxElevation.toFixed(0)}°{" "}
          {f.clock(pass.peak)}, {t.sets} {f.compass(last[0])} {f.clock(pass.end)}
        </p>
        <button
          type="button"
          onClick={() => downloadIcs(pass, f, lang)}
          className="mx-auto mt-3 flex items-center gap-2 rounded-card border border-fg-4 px-3 py-1.5 text-xs text-fg hover:border-accent active:scale-[0.98]"
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
  if (!receptions.length) return <p className="text-sm text-fg-2">{t.noSignals}</p>;
  const pick = receptions[Math.min(selected, receptions.length - 1)];
  const ago = (iso: string) => t.ago(f.duration(tick.real - new Date(iso).getTime()));

  return (
    <div>
      <p className="text-xs leading-relaxed text-fg-3">{t.signalsIntro}</p>
      <p className="mt-3 text-sm text-fg">
        {t.lastHeard(ago(receptions[0].start), receptions[0].station)}
      </p>
      <ul className="mt-3 space-y-1">
        {receptions.map((r, i) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={i === selected}
              className={`grid w-full grid-cols-[1fr_auto_auto] gap-3 rounded-card px-2 py-1.5 text-left font-mono text-xs tabular-nums ${
                i === selected ? "bg-line text-fg" : "text-fg-2 hover:bg-line/50"
              }`}
            >
              <span className="truncate">{r.station}</span>
              <span className="text-fg-3">{ago(r.start)}</span>
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
              className="max-h-[420px] w-full rounded-card object-cover object-top"
            />
            <figcaption className="mt-2 text-xs leading-relaxed text-fg-3">{t.waterfallCaption}</figcaption>
          </figure>
        ) : (
          pick.waterfall && (
            <button
              type="button"
              onClick={() => setShowing(pick.id)}
              className="w-full rounded-card border border-dashed border-fg-4 px-3 py-4 text-center text-sm text-fg hover:border-accent"
            >
              {t.showWaterfall}
              <span className="mt-1 block text-xs text-fg-4">{t.waterfallNote}</span>
            </button>
          )
        )}
        <a href={pick.url} className={`mt-3 inline-block text-xs text-fg-2 ${linkClass}`}>
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
      <p className="text-xs leading-relaxed text-fg-3">{t.tleIntro}</p>
      <pre className="mt-3 overflow-x-auto rounded-card border border-line p-3 font-mono text-[10.5px] leading-5 text-fg-4">
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
                  className={`cursor-help outline-none ${
                    active === seg.field ? "bg-accent text-on-accent" : "text-fg hover:text-accent"
                  }`}
                >
                  {seg.text}
                </span>
              ),
            )}
          </div>
        ))}
      </pre>
      <div className="mt-3 min-h-[4.5rem] rounded-card border border-line p-3" aria-live="polite">
        {field ? (
          <>
            <p className={label}>
              {t.tleLocation(field.line, field.to !== field.from ? `${field.from}-${field.to}` : `${field.from}`)}:{" "}
              {field.name[lang]}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-fg-2">
              {field.explain(lines[field.line].slice(field.from - 1, field.to), lang)}
            </p>
          </>
        ) : (
          <p className="text-xs text-fg-4">{t.tlePoint}</p>
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
      <aside className="w-full max-w-md border-t-2 border-fg bg-surface px-6 pb-6 pt-5 lg:w-[440px] lg:max-w-none">
        <h2 className="display text-4xl">FramSat-1</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-2">
          {t.introBefore}
          <a href="https://orbitntnu.com/projects/FramSat-1" className={linkClass}>
            Orbit NTNU
          </a>
          {t.introAfter}
        </p>

        {tick && <TimeControls tick={tick} speed={speed} f={f} />}

        <div
          role="tablist"
          aria-label={t.tabsAria}
          className="mt-6 flex gap-4 overflow-x-auto border-b border-line [scrollbar-width:none]"
        >
          {TAB_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px shrink-0 border-b-2 py-2 text-sm ${
                tab === id
                  ? "border-accent text-fg"
                  : "border-transparent text-fg-3 hover:text-fg"
              }`}
            >
              {t.tabs[id]}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="mt-5 min-h-[14rem]">
          {tick && tab === "overview" && <Overview tick={tick} facts={facts} next={ahead[0]} f={f} lang={lang} />}
          {tick && tab === "telemetry" && <Telemetry tick={tick} f={f} />}
          {tick && tab === "passes" && <Passes passes={ahead} tick={tick} f={f} lang={lang} />}
          {tick && tab === "signals" && <Signals receptions={receptions} tick={tick} f={f} />}
          {tick && tab === "tle" && <TleView tle={tle} facts={facts} tick={tick} f={f} lang={lang} />}
        </div>

        <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-fg-4">{t.footnote}</p>
      </aside>
    </section>
  );
}
