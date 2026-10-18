"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import styles from "./space.module.css";
import type { Credit } from "./types";

// A recording to play on request, never on its own. Without JavaScript the
// browser's own player is shown instead of the button.

const noop = () => () => {};

export function Sound({ src, label, credit }: { src: string; label: string; credit: Credit }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const live = useSyncExternalStore(noop, () => true, () => false);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  return (
    <figure className={styles.sound}>
      {live ? (
        <button type="button" className={styles.soundButton} onClick={toggle} aria-pressed={playing}>
          <span className={styles.soundIcon} aria-hidden="true" data-playing={playing ? "" : undefined} />
          {playing ? "Stop" : "Play"}: {label}
        </button>
      ) : (
        <p>{label}</p>
      )}
      <audio ref={audio} src={src} preload="none" controls={!live} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
      <figcaption className={styles.mediaNote}>
        <small>
          <a href={credit.url} target="_blank" rel="noopener">
            {credit.text}
          </a>
        </small>
      </figcaption>
    </figure>
  );
}
