import { createHmac, timingSafeEqual } from "node:crypto";

// The newsletter, through Resend's API (no SDK: four plain calls). People
// sign up with their email, get a link to confirm, and only then become a
// contact in the letters segment. I write and send each letter as a
// broadcast to that segment in Resend's dashboard; the ones sent show up
// on /letters by themselves.
//
// Environment (set in Vercel):
//   RESEND_API_KEY     a key with full access
//   RESEND_SEGMENT_ID  the segment the letters go to
//   LETTERS_FROM       optional, the sender (default below)

const API = "https://api.resend.com";
const SITE = "https://freider.space";
const FROM = process.env.LETTERS_FROM || "Freider Fløan <letters@freider.space>";

// How long a confirmation link works.
const LINK_DAYS = 7;

export const lettersEnabled = () => !!process.env.RESEND_API_KEY && !!process.env.RESEND_SEGMENT_ID;

async function resend(path: string, init: RequestInit & { next?: { revalidate: number } } = {}) {
  return fetch(API + path, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", ...init.headers },
  });
}

// Short enough for anyone, strict enough to catch typos like a missing dot.
export function cleanEmail(raw: unknown) {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null;
}

// The confirmation link carries the address, when it runs out and a
// signature, so nothing needs to be stored until someone confirms. The key
// comes from the API key: rotating it just retires the open links.
function sign(email: string, until: number) {
  return createHmac("sha256", `letters-confirm:${process.env.RESEND_API_KEY}`).update(`${email}\n${until}`).digest("base64url");
}

export function confirmLink(email: string, now = Date.now()) {
  // Runs out at the end of a day, so the link (and the email) is the same
  // all day: see the Idempotency-Key in sendConfirmation.
  const day = 86_400_000;
  const until = Math.ceil(now / day) * day + LINK_DAYS * day;
  const params = new URLSearchParams({ e: email, u: `${until}`, s: sign(email, until) });
  return `${SITE}/letters/confirm?${params}`;
}

export function checkLink(params: Record<string, string | string[] | undefined>) {
  const email = cleanEmail(params.e);
  const until = Number(params.u);
  const s = typeof params.s === "string" ? params.s : "";
  if (!email || !Number.isFinite(until)) return { ok: false as const, reason: "invalid" as const };
  const want = Buffer.from(sign(email, until));
  const got = Buffer.from(s);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return { ok: false as const, reason: "invalid" as const };
  if (until < Date.now()) return { ok: false as const, reason: "expired" as const };
  return { ok: true as const, email };
}

// One confirmation email per address per day, however often the form is
// sent: Resend answers a repeated Idempotency-Key with the first send, so
// the form can't be used to flood someone's inbox.
export async function sendConfirmation(email: string) {
  const link = confirmLink(email);
  const res = await resend("/emails", {
    method: "POST",
    headers: { "Idempotency-Key": `letters-confirm/${email}/${new Date().toISOString().slice(0, 10)}` },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: "Confirm your subscription",
      text: `Hi,\n\nSomeone (hopefully you) asked to get my letters at this address. To confirm, open this link:\n\n${link}\n\nIf it wasn't you, just ignore this email and you won't hear from me.\n\nFreider\nhttps://freider.space`,
      html: `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#0a1220;max-width:480px">
<p>Hi,</p>
<p>Someone (hopefully you) asked to get my letters at this address.</p>
<p><a href="${link}" style="display:inline-block;background:#0a1220;color:#eef2f5;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">Confirm subscription</a></p>
<p style="color:#5a6b7c">If it wasn't you, just ignore this email and you won't hear from me.</p>
<p>Freider<br><a href="${SITE}" style="color:#5a6b7c">freider.space</a></p>
</div>`,
    }),
  });
  // A repeat inside the same day comes back as the first send: still fine.
  if (!res.ok && res.status !== 409) throw new Error(`Resend /emails ${res.status}: ${await res.text()}`);
}

// Adds a confirmed address to the letters segment. Someone who was a
// contact before (or unsubscribed and came back) is subscribed again,
// since they just confirmed it themselves.
export async function addSubscriber(email: string) {
  const segment = process.env.RESEND_SEGMENT_ID!;
  const created = await resend("/contacts", {
    method: "POST",
    body: JSON.stringify({ email, unsubscribed: false, segments: [{ id: segment }] }),
  });
  if (created.ok) return;
  const id = encodeURIComponent(email);
  const updated = await resend(`/contacts/${id}`, { method: "PATCH", body: JSON.stringify({ unsubscribed: false }) });
  if (!updated.ok) throw new Error(`Resend contacts ${created.status}/${updated.status}: ${await updated.text()}`);
  const added = await resend(`/contacts/${id}/segments/${segment}`, { method: "POST" });
  // Already in the segment answers with an error too: nothing to do then.
  if (!added.ok && added.status >= 500) throw new Error(`Resend segment ${added.status}: ${await added.text()}`);
}

export type Letter = { id: string; subject: string; sentAt: string; preview: string; html: string; text: string };

type Broadcast = {
  id: string;
  status: string;
  segment_id?: string | null;
  audience_id?: string | null;
  sent_at: string | null;
  subject?: string;
  preview_text?: string | null;
  html?: string | null;
  text?: string | null;
};

// The archive is read again at most once an hour.
const REVALIDATE = 3600;

async function broadcast(id: string): Promise<Letter | null> {
  const res = await resend(`/broadcasts/${encodeURIComponent(id)}`, { next: { revalidate: REVALIDATE } });
  if (!res.ok) return null;
  const b = (await res.json()) as Broadcast;
  if (!isLetter(b)) return null;
  return {
    id: b.id,
    subject: b.subject || "A letter",
    sentAt: b.sent_at!,
    preview: b.preview_text || (b.text ?? "").replace(/\s+/g, " ").trim().slice(0, 160),
    html: b.html ?? "",
    text: b.text ?? "",
  };
}

// Only broadcasts that went out to the letters segment: drafts, scheduled
// ones and anything sent to another segment stay private.
const isLetter = (b: Broadcast) =>
  b.status === "sent" && !!b.sent_at && (b.segment_id ?? b.audience_id) === process.env.RESEND_SEGMENT_ID;

// Every letter sent so far, newest first.
export async function letters(): Promise<Letter[]> {
  if (!lettersEnabled()) return [];
  try {
    const res = await resend("/broadcasts?limit=100", { next: { revalidate: REVALIDATE } });
    if (!res.ok) return [];
    const { data } = (await res.json()) as { data: Broadcast[] };
    const sent = data.filter(isLetter).sort((a, b) => b.sent_at!.localeCompare(a.sent_at!));
    const full = await Promise.all(sent.map((b) => broadcast(b.id)));
    return full.filter((l): l is Letter => !!l);
  } catch {
    return [];
  }
}

export async function letter(id: string) {
  if (!lettersEnabled() || !/^[\w-]{1,64}$/.test(id)) return null;
  try {
    return await broadcast(id);
  } catch {
    return null;
  }
}

// A letter as an archive page shows it: Resend's merge tags filled with
// their fallbacks ("Hi {{{contact.first_name|there}}}" reads "Hi there"),
// the unsubscribe link sent to /letters, and links opening in a new tab.
export function archiveHtml(html: string) {
  const filled = html.replace(/\{\{\{\s*([^}|]+?)\s*(?:\|([^}]*))?\}\}\}/g, (_, tag: string, fallback?: string) =>
    /unsubscribe/i.test(tag) ? `${SITE}/letters` : (fallback ?? "").trim(),
  );
  const base = `<base target="_blank">`;
  return /<head[^>]*>/i.test(filled) ? filled.replace(/<head[^>]*>/i, (h) => h + base) : base + filled;
}

export const letterDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Oslo" }).format(new Date(iso));
