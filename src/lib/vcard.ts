import { twoline2satrec } from "satellite.js";
import { stateAt } from "@/app/framsat-orbit";
import { loadCountries, placeName } from "@/app/place-name";
import { CONTACT, type Card } from "@/lib/contact";
import { framsatTle } from "@/lib/framsat-tle";
import { stampOf } from "@/lib/stamp";

// The downloadable contact cards. Each is made fresh on download, so the
// note can say when it was saved and where FramSat-1 was at that moment.

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

// "14 October 2026 at 07:08 UTC". UTC for everyone, so nothing about the
// person saving the card goes into it.
function savedAt(now: Date) {
  const day = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return `${day} at ${time} UTC`;
}

const coordinates = (lat: number, lon: number) =>
  `${Math.abs(lat).toFixed(2)}° ${lat < 0 ? "S" : "N"}, ${Math.abs(lon).toFixed(2)}° ${lon < 0 ? "W" : "E"}`;

// "Saved 14 October 2026 at 07:08 UTC. FramSat-1 was 526 km above the
// Indian Ocean, at 12.34° S, 78.90° E."
async function note(now: Date) {
  const saved = `Saved ${savedAt(now)}.`;
  try {
    const [tle, countries] = await Promise.all([framsatTle(), loadCountries()]);
    const state = stateAt(twoline2satrec(tle.line1, tle.line2), now);
    if (!state) return saved;
    const where = placeName(countries, state.lat, state.lon, "en");
    return `${saved} FramSat-1 was ${Math.round(state.altitude)} km above ${where}, at ${coordinates(state.lat, state.lon)}.`;
  } catch {
    return saved;
  }
}

export async function vcard(card: Card, request: Request) {
  const now = new Date();
  const [image, text] = await Promise.all([photo(request.url), note(now)]);
  // The sky over a station that heard FramSat-1 around the minute they saved it.
  const postcard = `${CONTACT.website}/postcard/${stampOf(now)}`;

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escape(CONTACT.familyName)};${escape(CONTACT.givenName)};;;`,
    `FN:${escape(CONTACT.name)}`,
    ...(card.company ? [`ORG:${escape(card.company)}`] : []),
    `TITLE:${escape(card.title)}`,
    `BDAY:${CONTACT.birthday}`,
    `TEL;TYPE=CELL:${CONTACT.phone}`,
    `EMAIL;TYPE=INTERNET:${card.email}`,
    `URL:${CONTACT.website}`,
    // Grouped items get their own labels in Apple Contacts.
    ...(card.companyUrl ? [`item2.URL:${card.companyUrl}`, `item2.X-ABLabel:${escape(card.company ?? "Work")}`] : []),
    `X-SOCIALPROFILE;TYPE=linkedin:${CONTACT.linkedin}`,
    `item1.URL:${CONTACT.signal}`,
    "item1.X-ABLabel:Signal",
    `item3.URL:${postcard}`,
    "item3.X-ABLabel:FramSat-1 postcard",
    `NOTE:${escape(text)}`,
    `UID:${CONTACT.uid}`,
    ...(image ? [fold(`PHOTO;ENCODING=b;TYPE=JPEG:${image}`)] : []),
    "END:VCARD",
    "",
  ];

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${card.file}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
