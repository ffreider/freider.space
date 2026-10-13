import { CONTACT } from "@/lib/contact";

export const dynamic = "force-static";

const escape = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");

export function GET() {
  const card = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escape(CONTACT.familyName)};${escape(CONTACT.givenName)};;;`,
    `FN:${escape(CONTACT.name)}`,
    `TEL;TYPE=CELL:${CONTACT.phone}`,
    `EMAIL;TYPE=INTERNET:${CONTACT.email}`,
    `URL:${CONTACT.website}`,
    `X-SOCIALPROFILE;TYPE=linkedin:${CONTACT.linkedin}`,
    "END:VCARD",
    "",
  ].join("\r\n");

  return new Response(card, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="freider-floan.vcf"',
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
