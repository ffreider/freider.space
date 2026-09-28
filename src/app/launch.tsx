"use client";

import { useEffect, useState } from "react";

const WORD = "launch";
const TAPS = 5; // taps on the photo (anything with data-launch) within TAP_WINDOW
const TAP_WINDOW = 2000;

// Easter egg: type "launch", or tap the photo five times, and a rocket
// crosses the screen.
export function LaunchEasterEgg() {
  const [rockets, setRockets] = useState<number[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    console.log(
      "%c🚀 Psst. Try typing “launch”.",
      "font: 14px system-ui; color: #a855f7",
    );

    const launch = () => setRockets((r) => [...r, Date.now()]);

    let typed = "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
      typed = (typed + e.key.toLowerCase()).slice(-WORD.length);
      if (typed === WORD) {
        typed = "";
        launch();
      }
    };

    let taps: number[] = [];
    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-launch]")) return;
      const now = Date.now();
      taps = [...taps.filter((t) => now - t < TAP_WINDOW), now];
      if (taps.length >= TAPS) {
        taps = [];
        launch();
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <>
      {rockets.map((id) => (
        <div
          key={id}
          aria-hidden
          className="rocket"
          onAnimationEnd={() => setRockets((r) => r.filter((x) => x !== id))}
        >
          <div className="rocket-trail" />
          <svg viewBox="0 0 24 48" className="rocket-body">
            <path
              d="M12 1c5 5 7 12 7 20v13H5V21c0-8 2-15 7-20z"
              fill="currentColor"
            />
            <circle cx="12" cy="17" r="3" fill="var(--background)" />
            <path d="M5 26l-4 8v4l4-3zM19 26l4 8v4l-4-3z" fill="currentColor" />
            <path className="rocket-flame" d="M8 35h8l-4 11z" fill="#f59e0b" />
          </svg>
        </div>
      ))}
    </>
  );
}
