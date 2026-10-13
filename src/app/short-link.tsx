import type { Metadata } from "next";
import { after } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { track } from "@vercel/analytics/server";
import { SHORT_LINKS, appFor } from "@/lib/short-links";
import styles from "./contact/contact.module.css";

// The page behind each short link. Most targets are a plain redirect,
// temporary and never cached, so a phone that scanned it once still follows
// a changed target. Each scan is counted as a "Short link" event in Vercel
// Analytics.
export const shortLinkMetadata: Metadata = { title: "Freider Fløan", robots: { index: false, follow: false } };

export function shortLinkPage(slot: 1 | 2 | 3) {
  return async function ShortLink() {
    const target = SHORT_LINKS[slot] || "/";
    const app = appFor(target);
    const h = await headers();
    after(() => track("Short link", { slot, target }, { headers: h }).catch(() => {}));
    if (!app) redirect(target);
    return (
      <main className={styles.page}>
        <div className={styles.col}>
          <header className={styles.header}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/freider.jpg" width="96" height="96" alt="" className={styles.portrait} />
            <h1 className={styles.name}>Freider Fløan</h1>
            <p className={styles.intro}>on {app}</p>
          </header>
          <a href={target} className={styles.save}>Open {app}</a>
          <p className={styles.more}>Opens in the {app} app if you have it.</p>
        </div>
      </main>
    );
  };
}
