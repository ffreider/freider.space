import { after } from "next/server";
import { track } from "@vercel/analytics/server";

// Where freider.space/1, /2 and /3 lead. They're printed as QR codes (on my
// phone case, for one), so the addresses never change, only the targets
// here. Edit a target and push, and it's live in a minute. An empty target
// leads to the homepage.
export const SHORT_LINKS: Record<1 | 2 | 3, string> = {
  1: "https://www.linkedin.com/in/freider/",
  2: "/contact",
  3: "", // the Meso pitch deck on Brieflink, link to come
};

// The route behind each number. The redirect is temporary (307) and never
// cached, so a phone that scanned it once still follows a changed target.
// Each scan is counted as a "Short link" event in Vercel Analytics.
export function shortLink(slot: 1 | 2 | 3) {
  return function GET(request: Request) {
    const target = SHORT_LINKS[slot] || "/";
    after(() => track("Short link", { slot, target }, { request }).catch(() => {}));
    return new Response(null, {
      status: 307,
      headers: {
        Location: new URL(target, request.url).toString(),
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  };
}
