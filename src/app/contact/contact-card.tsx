import { CONTACT, type Card } from "@/lib/contact";
import { litPath, moonPhase } from "@/lib/moon-phase";
import styles from "./contact.module.css";

// The contact page, shared by /contact (personal) and /meso (work).
export function ContactCard({ card }: { card: Card }) {
  const ways = [
    { label: "Call", value: CONTACT.displayPhone, href: `tel:${CONTACT.phone}` },
    { label: "Email", value: card.email, href: `mailto:${card.email}` },
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

        {/* The two things people scan for. LinkedIn is a link on the page, not
            a redirect, so phones open it in the LinkedIn app, signed in. */}
        <div className={styles.actions}>
          <a href={`${card.path}/${card.file}`} className={styles.save}>Save contact</a>
          <a href={CONTACT.linkedin} className={styles.linkedin}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
            </svg>
            Connect on LinkedIn
          </a>
        </div>

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
