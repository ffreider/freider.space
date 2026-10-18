import type { Metadata } from "next";
import { Logbook } from "../../../framsat/log/logbook";

const description =
  "Hver gang en SatNOGS-bakkestasjon har hørt FramSat-1, Orbit NTNU sin studentsatellitt, siden oppskytingen 5. september 2026: stasjon, land, passering og vannfallsdiagram.";

export const metadata: Metadata = {
  title: "Loggbok for FramSat-1 | Freider Fløan",
  description,
  alternates: {
    canonical: "/no/framsat/log",
    languages: { en: "/framsat/log", nb: "/no/framsat/log", "x-default": "/framsat/log" },
  },
  openGraph: { title: "Loggbok for FramSat-1", description, url: "/no/framsat/log", siteName: "Freider Fløan", locale: "nb_NO" },
};

// New receptions from SatNOGS at most every 15 minutes.
export const revalidate = 900;

export default function Page() {
  return <Logbook lang="no" />;
}
