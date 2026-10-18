"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../postcard.module.css";

// The postcard image, which is drawn on the server the first time it's asked
// for (a few seconds). Until it arrives, the frame shows the empty horizon
// and a line saying what's happening; then the card fades in.
export function CardImage({ src, width, height, alt }: { src: string; width: number; height: number; alt: string }) {
  const img = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);

  // An image already in the browser's cache may finish before React hydrates.
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth > 0) setReady(true);
  }, []);

  return (
    <div className={styles.cardWrap} style={{ aspectRatio: `${width} / ${height}` }}>
      {!ready && (
        <div className={styles.loading} role="status">
          <div className={styles.horizon} />
          <p>Drawing the sky over the station…</p>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={img}
        src={src}
        width={width}
        height={height}
        alt={alt}
        className={`${styles.card} ${ready ? styles.shown : ""}`}
        onLoad={() => setReady(true)}
      />
    </div>
  );
}
