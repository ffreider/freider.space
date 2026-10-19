import { readFileSync } from "node:fs";
import path from "node:path";
import { Fragment } from "react";
import { decodeCatalogue } from "@/lib/space/catalogue";
import { fillTokens } from "@/lib/space/tokens";
import snapshot from "@/lib/space/snapshot.json";
import type { Beat } from "./chapter1";
import { ActCard } from "./act-card";
import { ColdOpenSection } from "./cold-open";
import { ACTS, COLD_OPEN } from "./acts";
import { LICENCES, MEDIA } from "./media";
import { MediaBlock } from "./media-blocks";
import { Rail } from "./rail";
import { Stage } from "./stage";
import styles from "./space.module.css";

// The chapter as an article, rendered on the server: search engines and
// readers without JavaScript get the whole story and its sources. The
// stage behind it (globe and counter) is added in the browser.

const file = readFileSync(path.join(process.cwd(), "public/space/catalogue.bin"));
const objs = decodeCatalogue(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));

const fill = (text: string) => fillTokens(text, objs);

// *word* → <em>word</em>; nothing else is markup.
const prose = (text: string) =>
  fill(text)
    .split(/\*([^*]+)\*/)
    .map((part, k) => (k % 2 ? <em key={k}>{part}</em> : <Fragment key={k}>{part}</Fragment>));

const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const snapshotDate = longDate(snapshot.date);
const untilDate = longDate(snapshot.until);

// What an act card's one number counts, said in words from its token, so the
// card can't claim something other than what was counted.
const KINDS: Record<string, string> = { satellites: "satellites", rocketBodies: "rocket stages", debris: "pieces of debris", unknown: "objects of unknown kind" };
function countLabel(token: string) {
  const m = /^\{count:(\d{4}-\d\d-\d\d)(?::(\w+))?\}$/.exec(token);
  if (!m) return "";
  return `${m[2] ? KINDS[m[2]] : "objects"} in orbit on ${longDate(m[1])}`;
}

// The five acts of the chapter, each a card placed right before its first beat.
const actBefore = new Map(ACTS.map((a) => [a.before, a]));

export function Story({ beats }: { beats: Beat[] }) {
  // Every credit printed in the story, once per beat, for the list at the end.
  const pictures = beats.flatMap((beat) =>
    (MEDIA[beat.id] ?? []).flatMap((m) => {
      if (m.kind === "archive") return [{ beat, what: m.picture.alt, credit: m.credit, licence: LICENCES[m.picture.src] }];
      if (m.kind === "sound") return [{ beat, what: m.label, credit: m.credit, licence: LICENCES[m.src] }];
      if (m.kind === "compare") return [{ beat, what: m.caption, credit: m.credit, licence: LICENCES[m.after.src] }];
      return [];
    }),
  );
  return (
    <main className={styles.page}>
      <Stage marks={beats.map(({ id, date, focus, highlight }) => ({ id, date, focus, highlight }))} />
      <Rail acts={ACTS.map(({ numeral, title, before }) => ({ numeral, title, before }))} beats={beats.map(({ id, title }) => ({ id, title }))} />
      {COLD_OPEN && <ColdOpenSection kicker={COLD_OPEN.kicker} paragraphs={COLD_OPEN.paragraphs.map(prose)} turn={prose(COLD_OPEN.turn)} />}
      <article className={styles.story}>
        <header className={styles.opening}>
          <p className={styles.chapter}>Chapter 1 of 3, 1957 to 2019</p>
          <h1>How we got here</h1>
          <p className={styles.lede}>
            In September 1957 nothing made by people went around the Earth. This is the story of how that changed, told
            through the objects themselves: every one that has been tracked, shown from the day it went up until the day it
            came down.
          </p>
          <p className={styles.note}>
            Every dot is a real object from the public satellite catalogue, as CelesTrak published it on {snapshotDate}.
            Its height and the tilt of its orbit are real; for objects that have since fallen, it is the orbit they were
            first tracked in, not the one they decayed from. Where each is along its orbit, and which way the orbit faces,
            the catalogue doesn&rsquo;t say, so those are spread out evenly. Blue is a satellite, working or not; warm grey is a
            spent rocket stage; the faint dots are debris. The catalogue doesn&rsquo;t record when a piece of debris was
            made, so fragments from the major break-ups appear on the day of the break-up, and the rest from roughly when
            they were first catalogued, which can be years later.
          </p>
        </header>

        {beats.map((b) => {
          const act = actBefore.get(b.id);
          return (
            <Fragment key={b.id}>
              {act && <ActCard act={act} number={fill(act.count)} numberLabel={countLabel(act.count)} witness={prose(act.witness)} />}
              <section id={b.id} className={styles.beat} data-beat>
                {(MEDIA[b.id] ?? []).map((m, k) => (
                  <MediaBlock key={k} media={m} fill={fill} />
                ))}
                <div className={styles.beatText}>
                  <p className={styles.kicker}>
                    <time dateTime={b.date}>{b.kicker}</time>
                  </p>
                  <h2>{b.title}</h2>
                  {b.body.map((p, k) => (
                    <p key={k}>{prose(p)}</p>
                  ))}
                </div>
              </section>
            </Fragment>
          );
        })}

        <footer className={styles.sources}>
          <h2>Sources</h2>
          <ol>
            {beats.map((b) => (
              <li key={b.id}>
                <a href={`#${b.id}`}>{b.kicker}</a>:{" "}
                {b.sources.map((s, k) => (
                  <Fragment key={s.url}>
                    {k > 0 && "; "}
                    <a href={s.url} target="_blank" rel="noopener">
                      {s.label}
                    </a>
                  </Fragment>
                ))}
              </li>
            ))}
          </ol>
          <p>
            Objects in orbit: the satellite catalogue (SATCAT) kept by the US Space Force and published by{" "}
            <a href="https://celestrak.org/satcat/" target="_blank" rel="noopener">
              CelesTrak
            </a>
            , snapshot of {snapshotDate}: the {snapshot.objects.toLocaleString("en-GB")} objects in it that were in orbit at
            some point up to {untilDate}. Early orbits of objects that have since fallen: Jonathan McDowell&rsquo;s{" "}
            <a href="https://planet4589.org/space/gcat/" target="_blank" rel="noopener">
              GCAT
            </a>{" "}
            (CC BY 4.0).
          </p>
          {pictures.length > 0 && (
            <>
              <h2 className={styles.picturesHeading}>Pictures</h2>
              <ul>
                {pictures.map(({ beat, what, credit, licence }) => (
                  <li key={`${beat.id}-${credit.url}`}>
                    <a href={`#${beat.id}`}>{beat.kicker}</a>: {what}. Credit:{" "}
                    <a href={credit.url} target="_blank" rel="noopener">
                      {credit.text}
                    </a>
                    {licence && <>; {licence}</>}.
                  </li>
                ))}
              </ul>
            </>
          )}
        </footer>
      </article>
    </main>
  );
}
