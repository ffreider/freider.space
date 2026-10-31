"use client";

// "Save image" fetches the print-size card (A5 at 300 dpi), which takes
// seconds of server time to draw. It's a button rather than a link so
// crawlers, which follow every href, never ask for it: on 29–31 Oct 2026 they
// did, for hundreds of postcards, and used up the month's Hobby CPU.
export function SaveButton({ stamp, className }: { stamp: string; className: string }) {
  // The print is a PNG download, not a page, so the router can't take it.
  return (
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    <button type="button" className={className} onClick={() => window.location.assign(`/postcard/${stamp}/print`)}>
      Save image
    </button>
  );
}
