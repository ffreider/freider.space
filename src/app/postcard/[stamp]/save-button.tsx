"use client";

import { useState } from "react";

// "Save image" fetches the print-size card (A5 at 300 dpi), which takes
// seconds of server time to draw. It's a button rather than a link so
// crawlers, which follow every href, never ask for it: on 29–31 Oct 2026 they
// did, for hundreds of postcards, and used up the month's Hobby CPU. The
// button says what's happening while the print is drawn and downloaded.
export function SaveButton({ stamp, className }: { stamp: string; className: string }) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");

  async function save() {
    setState("busy");
    try {
      const res = await fetch(`/postcard/${stamp}/print`);
      if (!res.ok) throw new Error(`${res.status}`);
      download(await res.blob(), `framsat-1-postcard-${stamp}.png`);
      setState("idle");
    } catch {
      setState("failed");
    }
  }

  return (
    <button type="button" className={className} onClick={save} disabled={state === "busy"} aria-live="polite">
      {state === "busy" ? "Preparing the print…" : state === "failed" ? "Couldn’t save. Try again" : "Save image"}
    </button>
  );
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
