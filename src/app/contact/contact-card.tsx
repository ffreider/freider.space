import { CONTACT, type Card } from "@/lib/contact";
import { litPath, moonPhase } from "@/lib/moon-phase";
import styles from "./contact.module.css";

// The contact page, shared by /contact (personal) and /meso (work).
export function ContactCard({ card }: { card: Card }) {
  const ways = [
    { label: "Call", value: CONTACT.displayPhone, href: `tel:${CONTACT.phone}` },
    { label: "Email", value: card.email, href: `mailto:${card.email}` },
    { label: "LinkedIn", value: "in/freider", href: CONTACT.linkedin },
  ];

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
          <p className={styles.intro}>{card.intro}</p>
        </header>

        <a href={`${card.path}/${card.file}`} className={styles.save}>Save contact</a>

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
        <p className={styles.privacy}>Privacy: no cookies. Visits are counted anonymously with Vercel Web Analytics.</p>
      </div>
    </main>
  );
}
