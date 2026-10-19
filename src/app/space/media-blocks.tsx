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
      // Wide, large pictures run edge to edge. Portraits, squares and small
      // files are shown whole, centred, no larger than their own size, so
      // nothing is cropped or blown up; the small ones get a thin frame, like
      // a document.
      const full = picture.width >= 1200 && picture.width / picture.height >= 1.3;
      const small = picture.width < 1200;
      const ratio = picture.width / picture.height;
      // The width a whole picture is shown at: its own size, no wider than the
      // screen, no taller than 88% of it. Setting it (with aspect-ratio) lets the
      // browser hold the place before the file arrives.
      const shown = `min(100%, ${picture.width}px, calc(88svh * ${ratio.toFixed(4)}))`;
      const srcSet = picture.srcSmall && picture.width > 900 ? `${picture.srcSmall} 900w, ${picture.src} ${picture.width}w` : undefined;
      return (
        <figure className={`${styles.bleed} ${full ? styles.archive : styles.archiveWhole} ${small ? styles.archiveSmall : ""}`}>
          <div className={styles.archiveFrame} style={full ? { aspectRatio: `${picture.width} / ${picture.height}` } : undefined}>
            {/* A plain img: the pictures are fixed files in public/, prepared in two sizes. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={picture.src}
              srcSet={srcSet}
              sizes={full ? "100vw" : `min(100vw, ${picture.width}px, calc(88vh * ${ratio.toFixed(4)}))`}
              alt={picture.alt}
              width={picture.width}
              height={picture.height}
              style={full ? { aspectRatio: `${picture.width} / ${picture.height}` } : { aspectRatio: `${picture.width} / ${picture.height}`, width: shown }}
              loading="lazy"
              decoding="async"
            />
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
