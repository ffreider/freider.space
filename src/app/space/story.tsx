import { readFileSync } from "node:fs";
import path from "node:path";
import { Fragment } from "react";
import { dayOf, decodeCatalogue } from "@/lib/space/catalogue";
import { countAt, type Counts } from "@/lib/space/counts";
import snapshot from "@/lib/space/snapshot.json";
import type { Beat } from "./chapter1";
import { Stage } from "./stage";
import styles from "./space.module.css";

// The chapter as an article, rendered on the server: search engines and
// readers without JavaScript get the whole story and its sources. The
// stage behind it (globe and counter) is added in the browser.

const file = readFileSync(path.join(process.cwd(), "public/space/catalogue.bin"));
const objs = decodeCatalogue(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));

// {count:1957-10-04} → the number of objects in orbit that day; a kind
// after a second colon counts only that kind.
const fill = (text: string) =>
  text.replace(/\{count:(\d{4}-\d\d-\d\d)(?::(\w+))?\}/g, (_, iso: string, kind?: string) => {
    const counts = countAt(objs, dayOf(new Date(`${iso}T00:00:00Z`)));
    return counts[(kind ?? "total") as keyof Counts].toLocaleString("en-GB");
  });

// *word* → <em>word</em>; nothing else is markup.
const prose = (text: string) =>
  fill(text)
    .split(/\*([^*]+)\*/)
    .map((part, k) => (k % 2 ? <em key={k}>{part}</em> : <Fragment key={k}>{part}</Fragment>));

const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const snapshotDate = longDate(snapshot.date);
const untilDate = longDate(snapshot.until);

export function Story({ beats }: { beats: Beat[] }) {
  return (
    <main className={styles.page}>
      <Stage marks={beats.map(({ id, date, focus, highlight }) => ({ id, date, focus, highlight }))} />
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

        {beats.map((b) => (
          <section key={b.id} id={b.id} className={styles.beat} data-beat>
            <p className={styles.kicker}>
              <time dateTime={b.date}>{b.kicker}</time>
            </p>
            <h2>{b.title}</h2>
            {b.body.map((p, k) => (
              <p key={k}>{prose(p)}</p>
            ))}
          </section>
        ))}

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
        </footer>
      </article>
    </main>
  );
}
