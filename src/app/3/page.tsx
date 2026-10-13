import type { Metadata, Viewport } from "next";
import { CONTACT } from "@/lib/contact";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: "Contact | Freider Fløan",
  description: "Save my contact details, call, email, or connect on LinkedIn.",
  alternates: { canonical: "/3", languages: {} },
  openGraph: {
    title: "Freider Fløan",
    description: "Let's stay in touch.",
    url: "/3",
    type: "profile",
  },
  twitter: { card: "summary_large_image", title: "Freider Fløan", description: "Let's stay in touch." },
};

export const viewport: Viewport = { themeColor: "#0a1220" };

function Icon({ kind }: { kind: "save" | "phone" | "email" | "linkedin" }) {
  const paths = {
    save: <><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M5 15v5h14v-5" /></>,
    phone: <path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a14 14 0 0 1-7-7l2-2-2-5Z" />,
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    linkedin: <><path d="M5 9v11M5 4v.5M10 20V9m0 5a4 4 0 0 1 8 0v6" /></>,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

export default function ContactPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        {/* The descent on the homepage needs a fresh page load. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className={styles.site}>freider.space <span aria-hidden="true">↗</span></a>
        <header className={styles.header}>
          {/* A local portrait; no image service needed for the contact page. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/freider.jpg" width="104" height="104" alt="" className={styles.portrait} />
          <p className={styles.eyebrow}>LET’S STAY IN TOUCH</p>
          <h1 className={styles.name}>{CONTACT.name}</h1>
          <p className={styles.intro}>I like starting things, mostly about space.</p>
        </header>
        <a href="/3/contact.vcf" className={styles.save}>
          <Icon kind="save" />
          <span>Save contact</span>
        </a>
        <p className={styles.hint}>Add my details to your phone.</p>
        <nav aria-label="Contact Freider" className={styles.links}>
          <a href={`tel:${CONTACT.phone}`} className={styles.link}>
            <Icon kind="phone" /><span><strong>Call</strong><small>{CONTACT.displayPhone}</small></span><span className={styles.arrow} aria-hidden="true">↗</span>
          </a>
          <a href={`mailto:${CONTACT.email}`} className={styles.link}>
            <Icon kind="email" /><span><strong>Email</strong><small>{CONTACT.email}</small></span><span className={styles.arrow} aria-hidden="true">↗</span>
          </a>
          <a href={CONTACT.linkedin} className={styles.link}>
            <Icon kind="linkedin" /><span><strong>LinkedIn</strong><small>Connect with me</small></span><span className={styles.arrow} aria-hidden="true">↗</span>
          </a>
        </nav>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className={styles.more}>A bit more about me <span aria-hidden="true">→</span></a>
      </div>
    </main>
  );
}
