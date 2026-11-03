import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { archiveHtml, letter, letterDate } from "@/lib/letters";
import { LettersForm } from "../form";
import { LetterFrame } from "../frame";
import Link from "next/link";
import styles from "../letters.module.css";

// One sent letter, as it arrived, with the sign-up under it for anyone who
// was sent the link.
export const revalidate = 3600;

export const viewport: Viewport = { themeColor: "#000000" };

export async function generateMetadata({ params }: PageProps<"/letters/[id]">): Promise<Metadata> {
  const l = await letter((await params).id);
  if (!l) return {};
  return {
    title: `${l.subject} | Letters | Freider Fløan`,
    description: l.preview || undefined,
    alternates: { canonical: `/letters/${l.id}`, languages: {} },
    openGraph: { title: l.subject, description: l.preview || undefined, url: `/letters/${l.id}`, type: "article", publishedTime: l.sentAt },
  };
}

export default async function LetterPage({ params }: PageProps<"/letters/[id]">) {
  const l = await letter((await params).id);
  if (!l) notFound();
  return (
    <main className={styles.page}>
      <article className={`${styles.col} ${styles.wide}`}>
        <nav className={styles.top}>
          {/* The descent on the homepage needs a fresh page load. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className={styles.site} href="/">freider.space</a>
          <Link href="/letters">All letters</Link>
        </nav>
        <p className={styles.meta}>
          <time dateTime={l.sentAt}>{letterDate(l.sentAt)}</time>
        </p>
        <h1 className={styles.title}>{l.subject}</h1>
        <div className={styles.paper}>
          <LetterFrame html={archiveHtml(l.html)} title={l.subject} />
        </div>
        <div className={styles.after}>
          <p>Get the next one by email.</p>
          <LettersForm where="letters" />
        </div>
      </article>
    </main>
  );
}
