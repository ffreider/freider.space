"use client";

import { useRef } from "react";

// A sent letter, shown as its email in a frame of its own so its styles
// stay inside. No scripts run in it; same origin only so the page can read
// its height and show the whole letter without a second scrollbar.
export function LetterFrame({ html, title }: { html: string; title: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const fit = () => {
    const doc = frame.current?.contentDocument;
    if (doc && frame.current) frame.current.style.height = `${doc.documentElement.scrollHeight}px`;
  };
  return (
    <iframe
      ref={frame}
      title={title}
      srcDoc={html}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      onLoad={fit}
    />
  );
}
