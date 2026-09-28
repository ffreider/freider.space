"use client";

import { useSyncExternalStore } from "react";

// A shared, adjustable clock for the FramSat-1 view: "time travel" lets the
// visitor scrub or fast-forward, and the globe and the panel both follow it.
// Simulated time = anchorSim + (real time since anchorReal) × speed.

let speed = 1;
let anchorReal = Date.now();
let anchorSim = anchorReal;
let version = 0;
const listeners = new Set<() => void>();

const notify = () => {
  version++;
  listeners.forEach((l) => l());
};

export function simNow() {
  return anchorSim + (Date.now() - anchorReal) * speed;
}

// Jump to `offsetMs` from the real time now, keeping the current speed.
export function setOffset(offsetMs: number) {
  anchorReal = Date.now();
  anchorSim = anchorReal + offsetMs;
  notify();
}

export function setSpeed(next: number) {
  anchorSim = simNow();
  anchorReal = Date.now();
  speed = next;
  notify();
}

export function goLive() {
  speed = 1;
  anchorReal = anchorSim = Date.now();
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Re-renders whenever the clock is changed (not on every tick).
export function useSimClock() {
  const v = useSyncExternalStore(subscribe, () => version, () => 0);
  return { version: v, speed };
}
