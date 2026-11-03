import { NextResponse } from "next/server";
import { cleanEmail, lettersEnabled, sendConfirmation } from "@/lib/letters";

// The sign-up form posts here: { email, website }. "website" is a field
// people never see; a bot that fills it in gets a cheerful answer and no
// email is sent.
export async function POST(request: Request) {
  if (!lettersEnabled()) return NextResponse.json({ error: "Sign-ups aren't open yet." }, { status: 503 });

  // Only this site's own pages may send the form.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown; website?: unknown } | null;
  if (body?.website) return NextResponse.json({ ok: true });
  const email = cleanEmail(body?.email);
  if (!email) return NextResponse.json({ error: "That doesn't look like an email address." }, { status: 400 });

  try {
    await sendConfirmation(email);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Try again in a minute." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
