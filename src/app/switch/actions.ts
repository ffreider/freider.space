"use server";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PRESETS, SLOTS, type Slot } from "@/lib/short-links";
import { COOKIE, COOKIE_MAX_AGE, cookieFor, fetchOverrides, signedIn, storeOverrides } from "@/lib/switch";

const HOURS = new Set([0, 1, 3, 12]);

export async function logIn(form: FormData) {
  const value = cookieFor(String(form.get("secret") ?? ""));
  if (!value) {
    // Slows down guessing; the secret is long enough that this is all it needs.
    await new Promise((r) => setTimeout(r, 1000));
    redirect("/switch?wrong=1");
  }
  (await cookies()).set(COOKIE, value, {
    path: "/switch",
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  redirect("/switch");
}

export async function logOut() {
  (await cookies()).delete({ name: COOKIE, path: "/switch" });
  redirect("/switch");
}

// Points a slot at a preset, optionally for a few hours, or with "default"
// hands it back to SHORT_LINKS. The tapped button says which: "2:hear".
export async function setSlot(form: FormData) {
  if (!(await signedIn())) notFound();
  const [s, preset = ""] = String(form.get("pick") ?? "").split(":");
  const slot = Number(s) as Slot;
  const hours = Number(form.get("hours") ?? 0);
  if (!SLOTS.includes(slot) || !HOURS.has(hours) || (preset !== "default" && !PRESETS[preset])) {
    redirect("/switch");
  }
  const overrides = await fetchOverrides();
  if (preset === "default") delete overrides[`${slot}`];
  else overrides[`${slot}`] = { preset, until: hours ? Date.now() + hours * 3600_000 : null };
  await storeOverrides(overrides);
  redirect(`/switch?hours=${hours}`);
}
