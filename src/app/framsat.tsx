"use client";

import { useEffect, useMemo, useState } from "react";
import { twoline2satrec } from "satellite.js";
import type { Tle } from "@/lib/framsat-tle";
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

const whole = (n: number) => Math.round(n).toLocaleString("en-US");
const fixed = (n: number, digits: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const signed = (n: number, digits: number) => `${n >= 0 ? "+" : "−"}${fixed(Math.abs(n), digits)}`;
const coord = (value: number, pos: string, neg: string) =>
  `${Math.abs(value).toFixed(2)}° ${value >= 0 ? pos : neg}`;
const compass = (az: number) =>
  ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(az / 45) % 8];

function duration(ms: number) {
  const minutes = Math.max(0, Math.round(Math.abs(ms) / 60_000));
  if (minutes < 1) return "under a minute";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}

const osloDay = (d: Date) => d.toLocaleDateString("en-GB", { timeZone: "Europe/Oslo" });
const osloClock = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Oslo" });

// "15:26", "tomorrow 04:12" or "Wed 1 Oct 04:12", relative to `now`.
function when(date: Date, now: number) {
  const time = osloClock(date);
  if (osloDay(date) === osloDay(new Date(now))) return time;
  if (osloDay(date) === osloDay(new Date(now + 86_400_000))) return `tomorrow ${time}`;
  const day = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Oslo",
  });
  return `${day} ${time}`;
}

const linkClass = "underline decoration-zinc-600 underline-offset-4 hover:decoration-current";
const label = "font-mono text-[10px] uppercase tracking-wide text-zinc-400";

// ————— Time travel —————

const SPEEDS = [1, 60, 600];
const MIN_OFFSET = -12 * 60; // minutes
const MAX_OFFSET = 24 * 60;

function TimeControls({ tick, speed }: { tick: SatTick; speed: number }) {
  const offset = tick.time - tick.real;
  const live = speed === 1 && Math.abs(offset) < 2000;
  const minutes = Math.round(offset / 60_000);

  return (
    <div className="mt-5 rounded-xl border border-zinc-800 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-xs tabular-nums">
          {live ? (
            <span className="text-emerald-300">● Live</span>
          ) : (
            <span className="text-amber-200">
              {offset >= 0 ? "+" : "−"}
              {duration(offset)}
            </span>
          )}
          <span className="text-zinc-400"> · {osloClock(new Date(tick.time))} Oslo time</span>
        </p>
        {!live && (
          <button
            type="button"
            onClick={goLive}
            className="font-mono text-[10px] uppercase tracking-wide text-zinc-300 hover:text-white"
          >
            Back to now
          </button>
        )}
      </div>
      <input
        type="range"
        aria-label="Time travel, in minutes from now"
        min={MIN_OFFSET}
        max={MAX_OFFSET}
        step={1}
        value={Math.min(MAX_OFFSET, Math.max(MIN_OFFSET, minutes))}
        onChange={(e) => setOffset(Number(e.target.value) * 60_000)}
        className="mt-3 w-full accent-fuchsia-400"
      />
      <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-zinc-500">
        <span>−12 h</span>
        <div className="flex gap-1" role="group" aria-label="Playback speed">
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
        <span>+24 h</span>
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
}: {
  tick: SatTick;
  facts: ReturnType<typeof orbitFacts>;
  next: Pass | undefined;
}) {
  const orbits =
    facts.revAtEpoch + (tick.time - facts.epoch.getTime()) / 60_000 / facts.periodMinutes;
  const travelledKm = orbits * 2 * Math.PI * facts.semiMajorAxisKm;
  const daysUp = Math.floor((tick.time - LAUNCH.getTime()) / 86_400_000);
  const overhead = tick.elevation > 0;

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
      <Stat
        name="Position"
        value={`${coord(tick.lat, "N", "S")}`}
        note={`${coord(tick.lon, "E", "W")}, ${whole(tick.altitude)} km up`}
      />
      <Stat
        name="From Trondheim"
        value={`${whole(distanceKm(TRONDHEIM.lat, TRONDHEIM.lon, tick.lat, tick.lon))} km`}
        note="along the ground"
      />
      <Stat name="Speed" value={`${whole(tick.speed)} km/h`} note={`${fixed(tick.speed / 3600, 2)} km/s`} />
      <Stat
        name="Light"
        value={tick.sunlit ? "Sunlight" : "Eclipse"}
        note={tick.sunlit ? "Solar panels in the Sun" : "In Earth’s shadow"}
      />
      <Stat
        name="Over Trondheim"
        value={overhead ? "Overhead now" : next ? `in ${duration(next.start.getTime() - tick.time)}` : "—"}
        note={
          overhead
            ? `${tick.elevation.toFixed(0)}° above the horizon`
            : next
              ? `peaks at ${next.maxElevation.toFixed(0)}°, ${when(next.peak, tick.time)}`
              : "no pass in the next 3 days"
        }
      />
      <Stat
        name="Since launch"
        value={`${whole(orbits)} orbits`}
        note={`${fixed(travelledKm / 1e6, 1)} million km in ${daysUp} days`}
      />
    </dl>
  );
}

function Telemetry({ tick }: { tick: SatTick }) {
  const r = tick.position;
  const v = tick.velocity;
  const shift = dopplerHz(tick.rangeRate);
  return (
    <div className="space-y-5">
      <Rows
        title="State vector · TEME frame"
        rows={[
          ["x", `${fixed(r.x, 1)} km`],
          ["y", `${fixed(r.y, 1)} km`],
          ["z", `${fixed(r.z, 1)} km`],
          ["|r|", `${fixed(Math.hypot(r.x, r.y, r.z), 1)} km`],
          ["vx", `${fixed(v.x, 3)} km/s`],
          ["vy", `${fixed(v.y, 3)} km/s`],
          ["vz", `${fixed(v.z, 3)} km/s`],
          ["|v|", `${fixed(Math.hypot(v.x, v.y, v.z), 3)} km/s`],
        ]}
      />
      <Rows
        title="Look angles from Trondheim"
        rows={[
          ["Azimuth", `${fixed(tick.azimuth, 1)}° ${compass(tick.azimuth)}`],
          ["Elevation", `${signed(tick.elevation, 1)}°`],
          ["Slant range", `${whole(tick.range)} km`],
          ["Range rate", `${signed(tick.rangeRate, 3)} km/s`],
        ]}
      />
      <div>
        <Rows
          title="Radio downlink"
          rows={[
            ["Frequency", `${fixed(DOWNLINK_HZ / 1e6, 3)} MHz`],
            ["Mode", "FSK 9k6 · AX.25 G3RUH"],
            ["Doppler", `${signed(shift / 1000, 2)} kHz`],
            ["Tune to", `${fixed((DOWNLINK_HZ + shift) / 1e6, 4)} MHz`],
          ]}
        />
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          {tick.elevation > 0
            ? "Above the horizon: a receiver in Trondheim could hear it now."
            : "Below Trondheim’s horizon right now, so the shift is only theoretical."}{" "}
          Frequency per{" "}
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
function SkyPlot({ pass, tick }: { pass: Pass; tick: SatTick }) {
  const point = ([az, el]: [number, number]) => {
    const r = (100 * (90 - el)) / 90;
    const a = (az * Math.PI) / 180;
    return [r * Math.sin(a), -r * Math.cos(a)] as const;
  };
  const track = pass.sky.map((p) => point(p).join(",")).join(" ");
  const [sx, sy] = point(pass.sky[0]);
  const [ex, ey] = point(pass.sky[pass.sky.length - 1]);
  const during =
    tick.time >= pass.start.getTime() && tick.time <= pass.end.getTime() && tick.elevation > 0;
  const [cx, cy] = point([tick.azimuth, Math.max(0, tick.elevation)]);

  return (
    <svg viewBox="-118 -118 236 236" className="mx-auto w-full max-w-[240px]" role="img"
      aria-label={`Sky plot: rises in the ${compass(pass.sky[0][0])}, peaks at ${pass.maxElevation.toFixed(0)}°, sets in the ${compass(pass.sky[pass.sky.length - 1][0])}`}>
      {[100, 66.7, 33.3].map((r) => (
        <circle key={r} r={r} fill="none" stroke="rgb(63 63 70)" strokeWidth={r === 100 ? 1 : 0.6} />
      ))}
      <path d="M0,-100V100M-100,0H100" stroke="rgb(63 63 70)" strokeWidth={0.6} />
      {[["N", 0, -108], ["E", 108, 0], ["S", 0, 108], ["W", -108, 0]].map(([t, x, y]) => (
        <text key={t} x={x} y={y} fill="rgb(161 161 170)" fontSize={9} textAnchor="middle" dominantBaseline="middle" className="font-mono">
          {t}
        </text>
      ))}
      <text x={3} y={-66.7 - 3} fill="rgb(113 113 122)" fontSize={7} className="font-mono">30°</text>
      <text x={3} y={-33.3 - 3} fill="rgb(113 113 122)" fontSize={7} className="font-mono">60°</text>
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

function Passes({ passes, tick }: { passes: Pass[]; tick: SatTick }) {
  const [selected, setSelected] = useState(0);
  if (!passes.length) {
    return <p className="text-sm text-zinc-300">No passes over Trondheim in the next three days.</p>;
  }
  const pass = passes[Math.min(selected, passes.length - 1)];
  return (
    <div>
      <p className="text-xs leading-relaxed text-zinc-400">
        Passes over Trondheim that climb at least 5° above the horizon. Pick one
        to see its path across the sky.
      </p>
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
              <span>{when(p.start, tick.time)}</span>
              <span className="text-zinc-400">{Math.round((p.end.getTime() - p.start.getTime()) / 60_000)} min</span>
              <span>{p.maxElevation.toFixed(0)}°</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <SkyPlot pass={pass} tick={tick} />
        <p className="mt-2 text-center font-mono text-[10px] text-zinc-400">
          <span className="text-emerald-300">●</span> rises {compass(pass.sky[0][0])} {osloClock(pass.start)} ·{" "}
          peaks {pass.maxElevation.toFixed(0)}° {osloClock(pass.peak)} ·{" "}
          <span className="text-red-400">●</span> sets {compass(pass.sky[pass.sky.length - 1][0])} {osloClock(pass.end)}
        </p>
      </div>
    </div>
  );
}

function TleView({ tle, facts, tick }: { tle: Tle; facts: ReturnType<typeof orbitFacts>; tick: SatTick }) {
  const [active, setActive] = useState<number | null>(null);
  const field = active === null ? null : TLE_FIELDS[active];
  const lines = { 1: tle.line1, 2: tle.line2 } as const;
  const ageHours = (tick.time - facts.epoch.getTime()) / 3_600_000;

  return (
    <div>
      <p className="text-xs leading-relaxed text-zinc-400">
        The raw two-line element set everything here is computed from. Hover or
        tab through the fields.
      </p>
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
              Line {field.line}, columns {field.from}
              {field.to !== field.from && `–${field.to}`} · {field.name}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-200">
              {field.explain(lines[field.line].slice(field.from - 1, field.to))}
            </p>
          </>
        ) : (
          <p className="text-xs text-zinc-500">Point at a field to see what it means.</p>
        )}
      </div>
      <div className="mt-5">
        <Rows
          title="Derived"
          rows={[
            ["Semi-major axis", `${whole(facts.semiMajorAxisKm)} km`],
            ["Perigee / apogee", `${whole(facts.perigeeKm)} / ${whole(facts.apogeeKm)} km`],
            ["Period", `${fixed(facts.periodMinutes, 2)} min`],
            ["Elements age", ageHours < 48 ? `${fixed(ageHours, 1)} h` : `${fixed(ageHours / 24, 1)} days`],
          ]}
        />
      </div>
    </div>
  );
}

// ————— The section —————

const TABS = [
  ["overview", "Overview"],
  ["telemetry", "Telemetry"],
  ["passes", "Passes"],
  ["tle", "TLE"],
] as const;
type TabId = (typeof TABS)[number][0];

// The finale: a full-screen section where the background globe opens up into
// the whole Earth (see backdrop.tsx, which looks for #framsat), with the live
// numbers in a panel beside it.
export function FramsatSection({ tle }: { tle: Tle }) {
  const satrec = useMemo(() => twoline2satrec(tle.line1, tle.line2), [tle]);
  const facts = useMemo(() => orbitFacts(satrec, tle.line2), [satrec, tle]);
  const tick = useFramsat(tle);
  const { speed } = useSimClock();
  const [tab, setTab] = useState<TabId>("overview");

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
          Live from orbit
        </p>
        <h2 className="mt-3 text-xl font-medium">
          <a href="https://orbitntnu.com/projects/FramSat-1" className={linkClass}>
            FramSat-1
          </a>
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          A student satellite I worked on at Orbit NTNU, in orbit since 5
          September 2026. Everything here is computed in your browser from its
          orbital elements with the SGP4 model.
        </p>
        <p className="mt-2 hidden text-xs text-zinc-400 [@media(pointer:fine)]:block">
          Drag the globe to spin it. Scrub or fast-forward time to watch it orbit.
        </p>

        {tick && <TimeControls tick={tick} speed={speed} />}

        <div role="tablist" aria-label="FramSat-1 data" className="mt-5 flex gap-1 border-b border-zinc-800">
          {TABS.map(([id, name]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-2.5 py-2 font-mono text-[11px] uppercase tracking-wide ${
                tab === id
                  ? "border-fuchsia-400 text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="mt-5 min-h-[18rem]">
          {tick && tab === "overview" && <Overview tick={tick} facts={facts} next={ahead[0]} />}
          {tick && tab === "telemetry" && <Telemetry tick={tick} />}
          {tick && tab === "passes" && <Passes passes={ahead} tick={tick} />}
          {tick && tab === "tle" && <TleView tle={tle} facts={facts} tick={tick} />}
        </div>
      </aside>
    </section>
  );
}
