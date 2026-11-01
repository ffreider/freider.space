import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { CONFIG_KEY, type Overrides } from "./short-links";

// /switch is mine alone. Logging in once with SWITCH_SECRET leaves a cookie
// that holds a hash of the secret, not the secret, and lasts half a year.
// Without SWITCH_SECRET set, /switch doesn't exist at all.
export const COOKIE = "switch";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

function token(secret: string) {
  return createHmac("sha256", secret).update("freider.space/switch").digest("hex");
}

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function switchEnabled() {
  return Boolean(process.env.SWITCH_SECRET);
}

export function cookieFor(secret: string) {
  const real = process.env.SWITCH_SECRET;
  return real && same(token(secret), token(real)) ? token(real) : null;
}

export async function signedIn() {
  const real = process.env.SWITCH_SECRET;
  const value = (await cookies()).get(COOKIE)?.value;
  return Boolean(real && value && same(value, token(real)));
}

// Global Config (called Edge Config until July 2026) is read through its
// SDK everywhere else, which is fast but can lag a write by a few seconds.
// /switch reads and writes through Vercel's API instead, so it always shows
// what it just stored.
function api(path: string, init?: RequestInit) {
  const id = process.env.GLOBAL_CONFIG_ID;
  const auth = process.env.VERCEL_API_TOKEN;
  if (!id || !auth) throw new Error("GLOBAL_CONFIG_ID and VERCEL_API_TOKEN must be set");
  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : "";
  return fetch(`https://api.vercel.com/v1/global-config/${id}${path}${team}`, {
    ...init,
    cache: "no-store",
    headers: { Authorization: `Bearer ${auth}`, "Content-Type": "application/json" },
  });
}

export async function fetchOverrides(): Promise<Overrides> {
  const res = await api(`/item/${CONFIG_KEY}`);
  // A key that was never stored comes back as 204 with no body, not 404.
  if (res.status === 204 || res.status === 404) return {};
  if (!res.ok) throw new Error(`Global Config read failed: ${res.status}`);
  return ((await res.json()) as { value?: Overrides }).value ?? {};
}

export async function storeOverrides(value: Overrides) {
  const res = await api("/items", {
    method: "PATCH",
    body: JSON.stringify({ items: [{ operation: "upsert", key: CONFIG_KEY, value }] }),
  });
  if (!res.ok) throw new Error(`Global Config write failed: ${res.status} ${await res.text()}`);
}
