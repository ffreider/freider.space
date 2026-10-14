// Where freider.space/1, /2 and /3 lead. They're printed as QR codes (on my
// phone case, for one), so the addresses never change, only the targets
// here. Edit a target and push, and it's live in a minute. An empty target
// leads to the homepage.
export const SHORT_LINKS: Record<1 | 2 | 3, string> = {
  1: "https://www.linkedin.com/in/freider/",
  2: "/contact",
  3: "/hear", // hear FramSat-1; the Meso pitch deck could go here later
};

// Sites with an app that a redirect can't open: phones only hand a link to
// its app when someone taps it on a page. These get a page with one button
// instead of a redirect, so the profile opens in the app, signed in.
export const APP_SITES: Record<string, string> = {
  "linkedin.com": "LinkedIn",
};

export function appFor(target: string) {
  if (!target.startsWith("http")) return null;
  const host = new URL(target).hostname.replace(/^www\./, "");
  return APP_SITES[host] ?? null;
}
