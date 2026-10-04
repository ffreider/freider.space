"use client";

import { useEffect, useState } from "react";

const FIRST_SWAP = 3200; // after the pop-in and the wave
const SWAP_EVERY = 2800;

// The speech bubble on the photo. It says hello, then runs through a few
// lines once (Trondheim, FramSat-1, a hint at the rocket easter egg in
// launch.tsx) and settles back on the hello. The red dot blinks like a
// transmitter. With reduced motion it just says hello.
export function Bubble({ lines }: { lines: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers = [...lines.slice(1), lines[0]].map((_, i) =>
      setTimeout(() => setIndex((i + 1) % lines.length), FIRST_SWAP + i * SWAP_EVERY),
    );
    return () => timers.forEach(clearTimeout);
  }, [lines]);

  return (
    <p aria-hidden className="bubble">
      <span className="bubble-dot" />
      <span key={index} className="bubble-text">
        {lines[index]}
      </span>
    </p>
  );
}
