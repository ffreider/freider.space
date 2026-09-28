"use client";

import { useEffect, useState } from "react";

const ISS_URL = "https://api.wheretheiss.at/v1/satellites/25544";
const TRONDHEIM = { lat: 63.4305, lon: 10.3951 };
const EARTH_RADIUS_KM = 6371;

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

type Reading = { distance: number; speed: number; daylight: boolean };

const km = (n: number) => Math.round(n).toLocaleString("en-US");

// A live line about where the International Space Station is right now,
// measured from Trondheim. Renders nothing until the first reading arrives,
// and nothing at all if the API can't be reached.
export function IssNow() {
  const [reading, setReading] = useState<Reading | null>(null);

  useEffect(() => {
    let cancelled = false;

    const update = async () => {
      try {
        const res = await fetch(ISS_URL);
        if (!res.ok) return;
        const iss = await res.json();
        if (cancelled) return;
        setReading({
          distance: distanceKm(TRONDHEIM.lat, TRONDHEIM.lon, iss.latitude, iss.longitude),
          speed: iss.velocity,
          daylight: iss.visibility === "daylight",
        });
      } catch {
        // Offline or rate-limited: keep the last reading.
      }
    };

    // Fetch once right away, then keep polling only while the tab is visible.
    update();
    const timer = setInterval(() => {
      if (!document.hidden) update();
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!reading) return null;

  return (
    <p className="flex items-start gap-2.5 text-sm text-zinc-500 dark:text-zinc-400">
      <span className="relative mt-1.5 size-2 shrink-0">
        <span className="absolute inset-0 rounded-full bg-emerald-500 motion-safe:animate-ping" />
        <span className="absolute inset-0 rounded-full bg-emerald-500" />
      </span>
      <span>
        Right now the International Space Station is{" "}
        <span className="font-mono tabular-nums text-foreground">
          {km(reading.distance)} km
        </span>{" "}
        from Trondheim, moving at{" "}
        <span className="font-mono tabular-nums text-foreground">
          {km(reading.speed)} km/h
        </span>
        {reading.daylight ? " in sunlight." : " in Earth’s shadow."}
      </span>
    </p>
  );
}
