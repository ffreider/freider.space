import type { Media } from "./types";
import { Compare } from "./compare";
import { MapBlock } from "./story-map";
import { Sound } from "./sound";
import styles from "./space.module.css";

// One beat's picture, figure, map or sound, placed before its text. Plain
// markup on the server wherever possible: only the slider, the sound button
// and the maps' scroll-linked parts run in the browser.

const Credit = ({ credit }: { credit: { text: string; url: string } }) => (
  <a href={credit.url} target="_blank" rel="noopener">
    {credit.text}
  </a>
);

export function MediaBlock({ media, fill }: { media: Media; fill: (text: string) => string }) {
  switch (media.kind) {
    case "archive": {
      const { picture, caption, credit } = media;
      return (
        <figure className={`${styles.bleed} ${styles.archive}`}>
          <div className={styles.archiveFrame} style={{ aspectRatio: `${picture.width} / ${picture.height}` }}>
            {/* A plain img: the pictures are fixed files in public/, sized when they were prepared. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={picture.src} alt={picture.alt} width={picture.width} height={picture.height} loading="lazy" decoding="async" sizes="100vw" />
          </div>
          <figcaption className={styles.mediaNote}>
            <span>{caption}</span>
            <small>
              <Credit credit={credit} />
            </small>
          </figcaption>
        </figure>
      );
    }
    case "compare":
      return (
        <div className={styles.bleed}>
          <Compare before={media.before} after={media.after} caption={media.caption} credit={media.credit} />
        </div>
      );
    case "number": {
      const to = fill(media.to);
      const share = to.startsWith("of ");
      return (
        <figure className={`${styles.bleed} ${styles.numberBlock}`}>
          <p className={styles.numberFigure}>
            <span>{fill(media.from)}</span>
            {share ? (
              " "
            ) : (
              <>
                <span className={styles.sr}> to </span>
                <span className={styles.numberArrow} aria-hidden="true">
                  →
                </span>
              </>
            )}
            <span className={styles.numberTo}>{to}</span>
          </p>
          <figcaption>{media.label}</figcaption>
        </figure>
      );
    }
    case "map":
      return (
        <div className={styles.bleed}>
          <MapBlock map={media.map} caption={media.caption} />
        </div>
      );
    case "sound":
      return (
        <div className={styles.bleed}>
          <Sound src={media.src} label={media.label} credit={media.credit} />
        </div>
      );
  }
}
