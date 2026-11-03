"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { LettersForm, SIGNED_UP } from "./form";
import styles from "./letters.module.css";

const noChange = () => () => {};

// Where the button goes, or nowhere: on the server, and in a browser that
// signed up before. Read once on load, so signing up now keeps the panel
// open to say "check your inbox".
function findSlot() {
  try {
    if (localStorage.getItem(SIGNED_UP) === "1") return null;
  } catch {}
  return document.getElementById("lettersSlot");
}

// The homepage's "Get my letters" button, in the top bar next to the other
// language, through the whole descent. It opens a small panel with the
// sign-up, and hides for good in a browser that has signed up. The top bar
// is plain HTML from markup.ts, so the button is placed in its slot there.
export function LettersButton() {
  const slot = useSyncExternalStore(noChange, findSlot, () => null);
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // Escape or a click anywhere else closes it.
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !button.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", away);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", away);
    };
  }, [open]);

  if (!slot) return null;
  return createPortal(
    <>
      <button
        ref={button}
        type="button"
        className={styles.pill}
        aria-expanded={open}
        aria-controls="lettersPanel"
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 4.5l6 4.5 6-4.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
        <span className={styles.long}>Get my letters</span>
        <span className={styles.short}>Letters</span>
      </button>
      {open && (
        <div ref={panel} id="lettersPanel" className={styles.panel} role="dialog" aria-label="Get my letters">
          <p className={styles.panelTitle}>Want to keep up?</p>
          <p className={styles.panelText}>
            I write a short letter every month or two about what I&rsquo;m working on.{" "}
            {/* a full page load, so the descent starts fresh on the way back */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/letters">Past letters</a>
          </p>
          <LettersForm where="home" autoFocus />
        </div>
      )}
    </>,
    slot,
  );
}
