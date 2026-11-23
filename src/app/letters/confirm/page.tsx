import type { Metadata, Viewport } from "next";
import { checkLink, lettersEnabled } from "@/lib/letters";
import { LettersForm } from "../form";
import { confirmSubscription } from "./actions";
import { Remember } from "./remember";
import Link from "next/link";
import styles from "../letters.module.css";

// Where the link in the confirmation email leads. Opening it checks the
// signature without mutating state (so mail scanners can't auto-confirm);
// clicking the button submits a POST action that adds the address.
export const metadata: Metadata = {
  title: "Letters | Freider Fløan",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#000000" };

export const dynamic = "force-dynamic";

type Status = "done" | "expired" | "invalid" | "failed" | "closed";

const SAY: Record<Status, { title: string; text: string }> = {
  done: { title: "You're in.", text: "Thanks! The next letter will come to your inbox. Every letter has a link to unsubscribe." },
  expired: { title: "That link has run out.", text: "Links to confirm work for a week. Leave your email again and I'll send a fresh one." },
  invalid: { title: "That link doesn't work.", text: "It may have been cut off when it was copied. Leave your email again and I'll send a fresh one." },
  failed: { title: "Something went wrong.", text: "Try the link again in a minute. If it keeps happening, sign up again below." },
  closed: { title: "Sign-ups aren't open yet.", text: "Come back soon." },
};

function isStatus(v: unknown): v is Status {
  return typeof v === "string" && v in SAY;
}

export default async function ConfirmPage({ searchParams }: PageProps<"/letters/confirm">) {
  const params = await searchParams;
  const status = isStatus(params.status) ? params.status : null;

  if (status) {
    const say = SAY[status];
    return (
      <main className={styles.page}>
        <div className={styles.col}>
          <nav className={styles.top}>
            {/* The descent on the homepage needs a fresh page load. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className={styles.site} href="/">freider.space</a>
          </nav>
          <header className={styles.header}>
            <h1 className={styles.title}>{say.title}</h1>
            <p className={styles.intro}>{say.text}</p>
          </header>
          {status === "done" ? (
            <>
              <Remember />
              <p className={styles.back}>
                <Link href="/letters">Read the past letters</Link> or go back to{" "}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/">freider.space</a>.
              </p>
            </>
          ) : status !== "closed" ? (
            <LettersForm where="letters" />
          ) : null}
        </div>
      </main>
    );
  }

  const link = lettersEnabled() ? checkLink(params) : null;
  if (!link || !link.ok) {
    const say = !link ? SAY.closed : SAY[link.reason];
    return (
      <main className={styles.page}>
        <div className={styles.col}>
          <nav className={styles.top}>
            {/* The descent on the homepage needs a fresh page load. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className={styles.site} href="/">freider.space</a>
          </nav>
          <header className={styles.header}>
            <h1 className={styles.title}>{say.title}</h1>
            <p className={styles.intro}>{say.text}</p>
          </header>
          {link ? <LettersForm where="letters" /> : null}
        </div>
      </main>
    );
  }

  const u = typeof params.u === "string" ? params.u : "";
  const s = typeof params.s === "string" ? params.s : "";

  return (
    <main className={styles.page}>
      <div className={styles.col}>
        <nav className={styles.top}>
          {/* The descent on the homepage needs a fresh page load. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className={styles.site} href="/">freider.space</a>
        </nav>
        <header className={styles.header}>
          <h1 className={styles.title}>One last step.</h1>
          <p className={styles.intro}>Confirm {link.email} to get my letters when I write them.</p>
        </header>
        <form action={confirmSubscription} className={styles.form}>
          <input type="hidden" name="e" value={link.email} />
          <input type="hidden" name="u" value={u} />
          <input type="hidden" name="s" value={s} />
          <button className={styles.submit} type="submit">Confirm subscription</button>
        </form>
      </div>
    </main>
  );
}
