import { twoline2satrec } from "satellite.js";
import { stateAt } from "@/app/framsat-orbit";
import { loadCountries, placeName } from "@/app/place-name";
import { CONTACT } from "@/lib/contact";
import { framsatTle } from "@/lib/framsat-tle";

// Made fresh on every download, so the note can say where FramSat-1 was
// at the moment the card was saved.
export const dynamic = "force-dynamic";

const escape = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");

// Long lines are folded at 75 characters, each continuation starting with a space.
// Only used for the photo, which is plain base64.
const fold = (line: string) => line.match(/.{1,74}/g)!.join("\r\n ");

// The portrait the site already serves; the card is still useful without it.
async function photo(origin: string) {
  try {
    const res = await fetch(new URL("/freider.jpg", origin), { cache: "force-cache", signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer()).toString("base64");
  } catch {
    return null;
  }
}

// "Saved 14 October 2026. FramSat-1 was 536 km above the Atlantic Ocean."
async function note(now: Date) {
  const day = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Oslo" });
  const saved = `Saved ${day}.`;
  try {
    const [tle, countries] = await Promise.all([framsatTle(), loadCountries()]);
    const state = stateAt(twoline2satrec(tle.line1, tle.line2), now);
    if (!state) return saved;
    const where = placeName(countries, state.lat, state.lon, "en");
    return `${saved} FramSat-1 was ${Math.round(state.altitude)} km above ${where}.`;
  } catch {
    return saved;
  }
}

export async function GET(request: Request) {
  const [image, text] = await Promise.all([photo(request.url), note(new Date())]);

  const card = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escape(CONTACT.familyName)};${escape(CONTACT.givenName)};;;`,
    `FN:${escape(CONTACT.name)}`,
    `ORG:${escape(CONTACT.company)}`,
    `TITLE:${escape(CONTACT.title)}`,
    `BDAY:${CONTACT.birthday}`,
    `TEL;TYPE=CELL:${CONTACT.phone}`,
    `EMAIL;TYPE=INTERNET:${CONTACT.email}`,
    `URL:${CONTACT.website}`,
    `X-SOCIALPROFILE;TYPE=linkedin:${CONTACT.linkedin}`,
    // The item1 group gives the link a "Signal" label in Apple Contacts.
    `item1.URL:${CONTACT.signal}`,
    "item1.X-ABLabel:Signal",
    `NOTE:${escape(text)}`,
    `UID:${CONTACT.uid}`,
    ...(image ? [fold(`PHOTO;ENCODING=b;TYPE=JPEG:${image}`)] : []),
    "END:VCARD",
    "",
  ].join("\r\n");

  return new Response(card, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="freider-floan.vcf"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
