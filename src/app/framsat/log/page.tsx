import type { Metadata } from "next";
import { Logbook } from "./logbook";

const description =
  "Every time a SatNOGS ground station heard FramSat-1, Orbit NTNU's student satellite, since launch on 5 September 2026: station, country, pass and waterfall.";

export const metadata: Metadata = {
  title: "FramSat-1 logbook | Freider Fløan",
  description,
  alternates: {
    canonical: "/framsat/log",
    languages: { en: "/framsat/log", nb: "/no/framsat/log", "x-default": "/framsat/log" },
  },
  openGraph: { title: "FramSat-1 logbook", description, url: "/framsat/log", siteName: "Freider Fløan", locale: "en_GB" },
};

// New receptions from SatNOGS at most every 15 minutes.
export const revalidate = 900;

export default function Page() {
  return <Logbook lang="en" />;
}
