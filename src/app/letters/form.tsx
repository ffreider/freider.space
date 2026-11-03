"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import styles from "./letters.module.css";

// Remembered in this browser once someone has signed up, so the homepage
// button stops asking. Storage can be blocked (private windows), and then
// the button simply stays.
export const SIGNED_UP = "letters:signed-up";
export function rememberSignUp() {
  try {
    localStorage.setItem(SIGNED_UP, "1");
  } catch {}
}

type State = { step: "idle" | "sending" | "sent" } | { step: "error"; message: string };

// The sign-up: one email field. The confirmation link goes out by email,
// and only a click on it adds the address to the list.
export function LettersForm({ where, autoFocus }: { where: "home" | "letters"; autoFocus?: boolean }) {
  const [state, setState] = useState<State>({ step: "idle" });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setState({ step: "sending" });
    try {
      const res = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), website: data.get("website") }),
      });
      const answer = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) return setState({ step: "error", message: answer.error ?? "Something went wrong. Try again in a minute." });
      rememberSignUp();
      track("Letters sign-up", { where });
      setState({ step: "sent" });
    } catch {
      setState({ step: "error", message: "No connection. Try again in a minute." });
    }
  }

  if (state.step === "sent") {
    return (
      <p className={styles.sent} role="status">
        <strong>Check your inbox.</strong> I&rsquo;ve sent you a link to confirm. It can take a minute, and might end up in spam.
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <label className={styles.hidden} htmlFor={`letters-email-${where}`}>
        Email
      </label>
      <div className={styles.row}>
        <input
          id={`letters-email-${where}`}
          className={styles.input}
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@email.com"
          autoFocus={autoFocus}
          aria-invalid={state.step === "error" || undefined}
          aria-describedby={state.step === "error" ? `letters-error-${where}` : undefined}
        />
        <button className={styles.submit} type="submit" disabled={state.step === "sending"}>
          {state.step === "sending" ? "Sending…" : "Subscribe"}
        </button>
      </div>
      {/* for bots only: people never see or fill this */}
      <input className={styles.hidden} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {state.step === "error" && (
        <p className={styles.error} id={`letters-error-${where}`} role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
