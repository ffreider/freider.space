import { get } from "@vercel/edge-config";

export type Slot = 1 | 2 | 3;
export const SLOTS: Slot[] = [1, 2, 3];

// Where freider.space/1, /2 and /3 lead. They're printed as QR codes (on my
// phone case, for one), so the addresses never change, only the targets
// here. Edit a target and push, and it's live in a minute. An empty target
// leads to the homepage. These are the defaults: /switch can point a slot
// somewhere else for a while, without a push.
export const SHORT_LINKS: Record<Slot, string> = {
  1: "/contact", // kept for the Meso pitch deck, once it's ready
  2: "/contact", // save my contact, or connect on LinkedIn
  3: "/hear", // hear FramSat-1
};

// The only places /switch can send a slot. It stores the name, never a
// URL, so even someone who got into /switch couldn't point my codes at a
// page of theirs. Add a target here and push to make it a button.
export const PRESETS: Record<string, { label: string; target: string }> = {
  contact: { label: "Contact", target: "/contact" },
  hear: { label: "Hear FramSat-1", target: "/hear" },
  framsat: { label: "FramSat-1 tracker", target: "/framsat" },
  space: { label: "The space age", target: "/space" },
  home: { label: "Homepage", target: "/" },
};

// What /switch writes to Edge Config, under one key: per slot, the preset
// and when it runs out (ms since 1970), or null to keep it until changed.
export const EDGE_KEY = "shortLinks";
export type Override = { preset: string; until: number | null };
export type Overrides = Partial<Record<`${Slot}`, Override>>;

// The overrides that still apply. Anything that goes wrong (no Edge Config
// on this deployment, the store unreachable, a preset since removed) falls
// back to the defaults, so a broken switch never breaks a printed code.
export async function readOverrides(): Promise<Overrides> {
  if (!process.env.EDGE_CONFIG) return {};
  try {
    return stillLive((await get<Overrides>(EDGE_KEY)) ?? {});
  } catch {
    return {};
  }
}

export function stillLive(all: Overrides): Overrides {
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(all).filter(([, o]) => o && PRESETS[o.preset] && (o.until === null || o.until > now)),
  ) as Overrides;
}

export async function targetFor(slot: Slot) {
  const override = (await readOverrides())[`${slot}`];
  if (override) return { target: PRESETS[override.preset].target, source: "switch" as const };
  return { target: SHORT_LINKS[slot] || "/", source: "default" as const };
}

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
