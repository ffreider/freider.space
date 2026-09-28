"use client";

import { useEffect, useMemo, useState } from "react";
import {
  degreesLat,
  degreesLong,
  eciToGeodetic,
  gstime,
  propagate,
  twoline2satrec,
} from "satellite.js";
import type { Tle } from "@/lib/framsat-tle";

export const TRONDHEIM = { lat: 63.4305, lon: 10.3951 };
const EARTH_RADIUS_KM = 6371;

export type SatPosition = {
  lat: number;
  lon: number;
  altitude: number; // km
  speed: number; // km/h
};

// Where FramSat-1 is right now, computed in the browser from its TLE with
// the standard SGP4 orbit model and updated every second. No network calls.
export function useFramsat(tle: Tle) {
  const satrec = useMemo(() => twoline2satrec(tle.line1, tle.line2), [tle]);
  const [position, setPosition] = useState<SatPosition | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const { position, velocity } = propagate(satrec, now);
      // The orbit model reports failure (e.g. a stale TLE) as `false`.
      if (typeof position !== "object" || typeof velocity !== "object") return;
      const geo = eciToGeodetic(position, gstime(now));
      const { x, y, z } = velocity;
      setPosition({
        lat: degreesLat(geo.latitude),
        lon: degreesLong(geo.longitude),
        altitude: geo.height,
        speed: Math.hypot(x, y, z) * 3600,
      });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [satrec]);

  return position;
}

// Great-circle distance along the ground between two points, in km.
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

const km = (n: number) => Math.round(n).toLocaleString("en-US");

// A live line about where FramSat-1 is right now, measured from Trondheim.
export function FramsatNow({ tle }: { tle: Tle }) {
  const sat = useFramsat(tle);
  if (!sat) return null;

  const distance = distanceKm(TRONDHEIM.lat, TRONDHEIM.lon, sat.lat, sat.lon);

  return (
    <p className="flex items-start gap-2.5 text-sm text-zinc-400">
      <span className="relative mt-1.5 size-2 shrink-0">
        <span className="absolute inset-0 rounded-full bg-fuchsia-500 motion-safe:animate-ping" />
        <span className="absolute inset-0 rounded-full bg-fuchsia-500" />
      </span>
      <span>
        Right now{" "}
        <a
          href="https://orbitntnu.com/projects/FramSat-1"
          className="underline decoration-zinc-600 underline-offset-4 hover:decoration-current"
        >
          FramSat-1
        </a>
        , a satellite I worked on at Orbit NTNU, is{" "}
        <span className="font-mono tabular-nums text-foreground">
          {km(sat.altitude)} km
        </span>{" "}
        up and{" "}
        <span className="font-mono tabular-nums text-foreground">
          {km(distance)} km
        </span>{" "}
        from Trondheim, moving at{" "}
        <span className="font-mono tabular-nums text-foreground">
          {km(sat.speed)} km/h
        </span>
        . It’s the pink dot on the globe.
      </span>
    </p>
  );
}
