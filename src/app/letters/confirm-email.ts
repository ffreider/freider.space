// The email that asks a new subscriber to confirm: a polar-night header
// with the latest FramSat-1 postcard, then the button on a light body.
// Tables and inline styles, so it holds up in Gmail, Apple Mail and Outlook.

export type EmailPostcard = { image: string; page: string; caption: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Single quotes: it goes inside style="…" attributes.
const FONT = `-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif`;

export function confirmEmail(link: string, postcard: EmailPostcard | null) {
  const subject = "One click and you're in";
  const intro = "Thanks for wanting my letters. Every month or two I write about what I'm working on. Confirm it's you, and the next one comes straight here.";
  const ignore = "Didn't sign up? Ignore this and you won't hear from me.";

  const sky = postcard
    ? `<tr><td style="padding:0"><a href="${esc(postcard.page)}"><img src="${esc(postcard.image)}" width="560" height="560" alt="A postcard from FramSat-1: the night sky over a radio station, the satellite's pass drawn as dashes of light" style="display:block;width:100%;max-width:560px;height:auto;border:0"></a></td></tr>
<tr><td style="padding:8px 28px 22px;font:12px/1.5 ${FONT};color:#7c8c9e">${esc(postcard.caption)} <a href="${esc(postcard.page)}" style="color:#a9d6ff">See the postcard</a></td></tr>`
    : `<tr><td style="padding:0 0 10px"></td></tr>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f3f5f7">
<div style="display:none;max-height:0;overflow:hidden">Confirm your email to get Freider's letters.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f5f7"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;border-radius:14px;overflow:hidden;background:#04060b">
<tr><td style="padding:30px 28px 22px;font-family:${FONT};color:#eef2f5">
<p style="margin:0;font-size:13px;font-weight:600;color:#a9d6ff">freider.space &middot; Letters</p>
<h1 style="margin:12px 0 0;font-size:32px;line-height:1.1;font-weight:700;letter-spacing:-0.02em;color:#eef2f5">One click and<br>you're in.</h1>
</td></tr>
${sky}
<tr><td style="background:#ffffff;padding:26px 28px 28px;font-family:${FONT};color:#0a1220">
<p style="margin:0 0 22px;font-size:16px;line-height:1.55;color:#3c4a58">${intro}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:999px;background:#0a1220"><a href="${esc(link)}" style="display:inline-block;padding:14px 26px;font:600 16px/1 ${FONT};color:#eef2f5;text-decoration:none;border-radius:999px">Yes, send me the letters</a></td></tr></table>
<p style="margin:26px 0 0;font-size:16px;line-height:1.5">Freider</p>
<p style="margin:22px 0 0;padding-top:14px;border-top:1px solid #e3e8ed;font-size:12.5px;line-height:1.5;color:#7a8896">${ignore} &middot; <a href="https://freider.space" style="color:#7a8896">freider.space</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = `One click and you're in.

${intro}

Yes, send me the letters:
${link}
${postcard ? `\nA postcard from FramSat-1: ${postcard.caption}\n${postcard.page}\n` : ""}
Freider
https://freider.space

${ignore}`;

  return { subject, html, text };
}
