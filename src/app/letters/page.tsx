import type { Metadata, Viewport } from "next";
import { letterDate, letters } from "@/lib/letters";
import { LettersForm } from "./form";
import Link from "next/link";
import styles from "./letters.module.css";

// The sign-up and every letter sent so far. freider.space/3 leads here.
export const metadata: Metadata = {
  title: "Letters | Freider Fløan",
  description: "Letters from Freider Fløan, every month or two, about what I'm working on. Sign up, or read the past ones.",
  alternates: { canonical: "/letters", languages: {} },
  openGraph: { title: "Letters from Freider Fløan", description: "A short letter every month or two about what I'm working on.", url: "/letters", type: "website" },
  twitter: { card: "summary_large_image", title: "Letters from Freider Fløan", description: "A short letter every month or two about what I'm working on." },
};

export const viewport: Viewport = { themeColor: "#000000" };

// New letters show up within the hour.
export const revalidate = 3600;

export default async function LettersPage() {
  const sent = await letters();
  return (
    <main className={styles.page}>
      <div className={styles.col}>
        <nav className={styles.top}>
          {/* The descent on the homepage needs a fresh page load. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className={styles.site} href="/">freider.space</a>
        </nav>
        <header className={styles.header}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/freider.jpg" width="72" height="72" alt="" className={styles.portrait} />
          <h1 className={styles.title}>Letters</h1>
          <p className={styles.intro}>
            Every month or two I write a short letter about what I&rsquo;m working on. Leave your email and I&rsquo;ll send them to you.
          </p>
        </header>
        <LettersForm where="letters" />
        <p className={styles.fine}>
          You&rsquo;ll get an email to confirm first. Your address is kept with Resend, used for these letters only, and every letter has a link to unsubscribe.
        </p>

        <section className={styles.past} aria-labelledby="past">
          <h2 id="past">Past letters</h2>
          {sent.length ? (
            <ul className={styles.list}>
              {sent.map((l) => (
                <li key={l.id}>
                  <Link className={styles.item} href={`/letters/${l.id}`}>
                    <time dateTime={l.sentAt}>{letterDate(l.sentAt)}</time>
                    <strong>{l.subject}</strong>
                    {l.preview && <span>{l.preview}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>The first one is on its way.</p>
          )}
        </section>
      </div>
    </main>
  );
}
