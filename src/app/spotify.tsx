"use client";

import { useState } from "react";

const SHOW_ID = "7ofO8qm8tRBk2llQEMK8JB";

// Spotify's player sets tracking cookies as soon as it loads, so it only
// loads once the visitor asks for it. Until then this is a plain button.
export function SpotifyPlayer() {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        title="Spacepodden on Spotify"
        src={`https://open.spotify.com/embed/show/${SHOW_ID}?utm_source=generator&autoplay=1`}
        width="100%"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="mt-4 max-w-md rounded-xl border-0"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="group mt-4 flex w-full max-w-md items-center gap-4 rounded-xl border border-zinc-200 bg-background/60 p-3 text-left backdrop-blur transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#1db954] text-black transition group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="ml-0.5 size-5" fill="currentColor" aria-hidden>
          <path d="M8 5.5v13l10.5-6.5z" />
        </svg>
      </span>
      <span>
        <span className="block text-sm">Listen to Spacepodden</span>
        <span className="block text-xs text-zinc-500">
          Loads the Spotify player, which sets Spotify cookies.
        </span>
      </span>
    </button>
  );
}
