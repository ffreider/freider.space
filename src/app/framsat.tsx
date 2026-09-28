"use client";

import { useEffect, useMemo, useState } from "react";
import { twoline2satrec } from "satellite.js";
import type { Tle } from "@/lib/framsat-tle";
import {
  LAUNCH,
  nextPass,
  orbitFacts,
  type SatState,
  stateAt,
  TRONDHEIM,
} from "./framsat-orbit";

export { TRONDHEIM };
export type { SatState };

// FramSat-1's state right now, recalculated every second in the browser from
// its TLE with the standard SGP4 orbit model. No network calls.
export function useFramsat(tle: Tle) {
  const satrec = useMemo(() => twoline2satrec(tle.line1, tle.line2), [tle]);
  const [state, setState] = useState<SatState | null>(null);

  useEffect(() => {
    const update = () => setState(stateAt(satrec, new Date()));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [satrec]);

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
const coord = (value: number, pos: string, neg: string) =>
  `${Math.abs(value).toFixed(1)}° ${value >= 0 ? pos : neg}`;

function countdown(ms: number) {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 1) return "under a minute";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}

function osloTime(date: Date) {
  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Oslo",
  });
  const day = (d: Date) => d.toLocaleDateString("en-GB", { timeZone: "Europe/Oslo" });
  return day(date) === day(new Date()) ? `at ${time}` : `tomorrow at ${time}`;
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-background/70 p-4 backdrop-blur-md">
      <p className="font-mono text-[10px] uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-2 font-mono text-lg tabular-nums text-foreground">{value}</p>
      {note && <p className="mt-1 text-xs leading-relaxed text-zinc-300">{note}</p>}
    </div>
  );
}

export function FramsatSection({ tle }: { tle: Tle }) {
  const satrec = useMemo(() => twoline2satrec(tle.line1, tle.line2), [tle]);
  const facts = useMemo(() => orbitFacts(satrec, tle.line2), [satrec, tle]);
  const sat = useFramsat(tle);

  // The next pass over Trondheim (or the one happening now), looked up again
  // once a minute so it moves on after each pass.
  const minute = sat ? Math.floor(sat.time / 60_000) : null;
  const pass = useMemo(
    () => (minute === null ? null : nextPass(satrec, new Date(minute * 60_000))),
    [satrec, minute],
  );

  if (!sat) return null;

  const now = sat.time;
  const orbits =
    facts.revAtEpoch + (now - facts.epoch.getTime()) / 60_000 / facts.periodMinutes;
  const travelledKm = orbits * 2 * Math.PI * facts.semiMajorAxisKm;
  const daysUp = Math.floor((now - LAUNCH.getTime()) / 86_400_000);
  const overhead = sat.elevation > 0;

  return (
    <section className="mt-32 sm:mt-40">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-fuchsia-300">
        <span className="relative size-2">
          <span className="absolute inset-0 rounded-full bg-fuchsia-400 motion-safe:animate-ping" />
          <span className="absolute inset-0 rounded-full bg-fuchsia-400" />
        </span>
        Live from orbit
      </p>
      <h2 className="mt-3 text-xl font-medium">
        <a
          href="https://orbitntnu.com/projects/FramSat-1"
          className="underline decoration-zinc-600 underline-offset-4 hover:decoration-current"
        >
          FramSat-1
        </a>
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">
        A student satellite I worked on at Orbit NTNU, in orbit since 5 September
        2026. Everything here is calculated live in your browser from its orbital
        elements, and the globe behind this page turns to follow it.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Right now"
          value={`${coord(sat.lat, "N", "S")}, ${coord(sat.lon, "E", "W")}`}
          note={`${whole(sat.altitude)} km up, ${whole(distanceKm(TRONDHEIM.lat, TRONDHEIM.lon, sat.lat, sat.lon))} km from Trondheim.`}
        />
        <Stat
          label="Speed"
          value={`${whole(sat.speed)} km/h`}
          note={`${(sat.speed / 3600).toFixed(1)} km every second.`}
        />
        <Stat
          label="Light"
          value={sat.sunlit ? "In sunlight" : "In Earth’s shadow"}
          note={
            sat.sunlit
              ? "The Sun is shining on its solar panels."
              : "The Earth is blocking the Sun."
          }
        />
        <Stat
          label="Over Trondheim"
          value={
            overhead
              ? "Above the horizon"
              : pass
                ? `In ${countdown(pass.start.getTime() - now)}`
                : "No pass in the next two days"
          }
          note={
            overhead
              ? `${sat.elevation.toFixed(0)}° up in the sky right now.`
              : pass
                ? `Rises to ${pass.maxElevation.toFixed(0)}° above the horizon, ${osloTime(pass.peak)}.`
                : undefined
          }
        />
        <Stat
          label="One orbit"
          value={`${facts.periodMinutes.toFixed(1)} min`}
          note={`${facts.orbitsPerDay.toFixed(1)} laps around the Earth every day.`}
        />
        <Stat
          label="Since launch"
          value={`${whole(orbits)} orbits`}
          note={`About ${(travelledKm / 1e6).toFixed(1)} million km in ${daysUp} days.`}
        />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-zinc-400">
        Orbit {whole(facts.perigeeKm)}–{whole(facts.apogeeKm)} km up, inclined{" "}
        {facts.inclination.toFixed(1)}° so it passes close to both poles.
        Orbital elements from{" "}
        <a
          href="https://db.satnogs.org/satellite/BXJV-0815-0756-1233-1493"
          className="underline decoration-zinc-600 underline-offset-4 hover:decoration-current"
        >
          SatNOGS
        </a>
        , measured{" "}
        {facts.epoch.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        })}
        .
      </p>
    </section>
  );
}
