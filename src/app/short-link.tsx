import type { Metadata } from "next";
import { after } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { track } from "@vercel/analytics/server";
import { type Slot, appFor, targetFor } from "@/lib/short-links";
import styles from "./contact/contact.module.css";

// The page behind each short link. Most targets are a plain redirect,
// temporary and never cached, so a phone that scanned it once still follows
// a changed target. Each scan is counted as a "Short link" event in Vercel
// Analytics, with whether the target came from /switch or the defaults.
export const shortLinkMetadata: Metadata = { title: "Freider Fløan", robots: { index: false, follow: false } };

export function shortLinkPage(slot: Slot) {
  return async function ShortLink() {
    const { target, source } = await targetFor(slot);
    const app = appFor(target);
    const h = await headers();
    after(() => track("Short link", { slot, target, source }, { headers: h }).catch(() => {}));
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
        </div>
      </main>
    );
  };
}
