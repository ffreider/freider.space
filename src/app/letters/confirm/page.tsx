import type { Metadata, Viewport } from "next";
import { addSubscriber, checkLink, lettersEnabled } from "@/lib/letters";
import { LettersForm } from "../form";
import { Remember } from "./remember";
import Link from "next/link";
import styles from "../letters.module.css";

// Where the link in the confirmation email leads. Opening it is the
// confirmation: the address joins the list here, and not before.
export const metadata: Metadata = {
  title: "Letters | Freider Fløan",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#000000" };

export const dynamic = "force-dynamic";

async function confirm(params: Record<string, string | string[] | undefined>) {
  if (!lettersEnabled()) return "closed" as const;
  const link = checkLink(params);
  if (!link.ok) return link.reason;
  try {
    await addSubscriber(link.email);
    return "done" as const;
  } catch (err) {
    console.error(err);
    return "failed" as const;
  }
}

const SAY = {
  done: { title: "You're in.", text: "Thanks! The next letter will come to your inbox. Every letter has a link to unsubscribe." },
  expired: { title: "That link has run out.", text: "Links to confirm work for a week. Leave your email again and I'll send a fresh one." },
  invalid: { title: "That link doesn't work.", text: "It may have been cut off when it was copied. Leave your email again and I'll send a fresh one." },
  failed: { title: "Something went wrong.", text: "Try the link again in a minute. If it keeps happening, sign up again below." },
  closed: { title: "Sign-ups aren't open yet.", text: "Come back soon." },
};

export default async function ConfirmPage({ searchParams }: PageProps<"/letters/confirm">) {
  const result = await confirm(await searchParams);
  const say = SAY[result];
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
        {result === "done" ? (
          <>
            <Remember />
            <p className={styles.back}>
              <Link href="/letters">Read the past letters</Link> or go back to{" "}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/">freider.space</a>.
            </p>
          </>
        ) : result !== "closed" ? (
          <LettersForm where="letters" />
        ) : null}
      </div>
    </main>
  );
}
