"use client";

import { useSyncExternalStore } from "react";

// One shared, live feed of the International Space Station's position, used
// by both the globe and the text line so the API is polled only once.

const ISS_URL = "https://api.wheretheiss.at/v1/satellites/25544";
const POLL_MS = 5000;

export type IssPosition = {
  lat: number;
  lon: number;
  speed: number; // km/h
  daylight: boolean;
};

let latest: IssPosition | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

async function poll() {
  try {
    const res = await fetch(ISS_URL);
    if (!res.ok) return;
    const iss = await res.json();
    latest = {
      lat: iss.latitude,
      lon: iss.longitude,
      speed: iss.velocity,
      daylight: iss.visibility === "daylight",
    };
    listeners.forEach((notify) => notify());
  } catch {
    // Offline or rate-limited: keep the last position.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    // Fetch right away, then keep polling only while the tab is visible.
    poll();
    timer = setInterval(() => {
      if (!document.hidden) poll();
    }, POLL_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useIss() {
  return useSyncExternalStore(
    subscribe,
    () => latest,
    () => null,
  );
}
