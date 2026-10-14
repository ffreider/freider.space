import type { Metadata, Viewport } from "next";
import { loadCountries, placeName } from "@/app/place-name";
import { framsatTle } from "@/lib/framsat-tle";
import { latestRecording } from "@/lib/satnogs";
import { Hear } from "./hear";

// Where freider.space/3 (the QR code on my phone case) leads: hear FramSat-1,
// see what it's flying over, find out when it passes over you, save my card.
// Kept out of search results: it's for people who scanned the code.
export const metadata: Metadata = {
  title: "Hear FramSat-1 | Freider Fløan",
  description: "The real radio signal of FramSat-1, a student satellite I worked on, and when it next flies over you.",
  alternates: { canonical: "/hear", languages: {} },
  robots: { index: false, follow: true },
  openGraph: { title: "Hear FramSat-1", description: "The real radio signal of a satellite in orbit.", url: "/hear" },
};

export const viewport: Viewport = { themeColor: "#000000" };

// SatNOGS is asked for a newer recording at most every 15 minutes.
export const revalidate = 900;

// "in the United States", "in the Netherlands", "in Ukraine"
function inPlace(name: string) {
  if (name === "United States of America") return "the United States";
  if (/^(the |United |Netherlands|Czech Republic|Philippines|Bahamas|Gambia|Dominican Republic|Central African|Maldives)/.test(name)) {
    return name.startsWith("the ") ? name : `the ${name}`;
  }
  return name;
}

export default async function HearPage() {
  const [tle, recording, countries] = await Promise.all([framsatTle(), latestRecording(), loadCountries()]);
  const station = recording && {
    ...recording,
    where: Number.isFinite(recording.lat) ? inPlace(placeName(countries, recording.lat, recording.lon, "en")) : null,
  };
  return <Hear tle={tle} recording={station} />;
}
