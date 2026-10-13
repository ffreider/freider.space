import type { Metadata, Viewport } from "next";
import { CONTACT } from "@/lib/contact";
import { litPath, moonPhase } from "@/lib/moon-phase";
import styles from "./contact.module.css";

// Kept out of search results: it's for people who were handed the link.
export const metadata: Metadata = {
  title: "Contact | Freider Fløan",
  description: "Save my contact details, call, email or connect on LinkedIn.",
  alternates: { canonical: "/contact", languages: {} },
  robots: { index: false, follow: true },
  openGraph: { title: "Freider Fløan", description: "Save my contact details.", url: "/contact", type: "profile" },
  twitter: { card: "summary_large_image", title: "Freider Fløan", description: "Save my contact details." },
};

export const viewport: Viewport = { themeColor: "#000000" };

// Tonight's Moon in the corner, as in the browser tab; redrawn every 6 hours.
export const revalidate = 21600;

const ways = [
  { label: "Call", value: CONTACT.displayPhone, href: `tel:${CONTACT.phone}` },
  { label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { label: "LinkedIn", value: "in/freider", href: CONTACT.linkedin },
];

export default function ContactPage() {
  return (
    <main className={styles.page}>
      <div className={styles.col}>
        <div className={styles.top}>
          {/* The descent on the homepage needs a fresh page load. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className={styles.site}>freider.space</a>
          <svg className={styles.moon} width="22" height="22" viewBox="0 0 22 22" role="img" aria-label="Tonight’s Moon">
            <circle cx="11" cy="11" r="10" fill="#26324a" />
            <path d={litPath(moonPhase(), 11, 11, 10)} fill="#eef2f5" />
          </svg>
        </div>

        <header className={styles.header}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/freider.jpg" width="96" height="96" alt="" className={styles.portrait} />
          <h1 className={styles.name}>{CONTACT.name}</h1>
          <p className={styles.intro}>I like starting things, mostly about space.</p>
        </header>

        <a href="/contact/freider-floan.vcf" className={styles.save}>Save contact</a>

        <nav aria-label="Other ways to reach me" className={styles.ways}>
          {ways.map((w) => (
            <a key={w.label} href={w.href} className={styles.way}>
              <span className={styles.label}>{w.label}</span>
              <span className={styles.value}>{w.value}</span>
            </a>
          ))}
        </nav>

        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <p className={styles.more}>More about me on <a href="/">freider.space</a></p>
      </div>
    </main>
  );
}
