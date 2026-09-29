import type { Metadata } from "next";
import { FramsatPage } from "../framsat-page";

const description =
  "Where Orbit NTNU's student satellite FramSat-1 is right now: its live position on a globe, passes over Trondheim, Doppler shift, SatNOGS receptions and the annotated TLE.";

export const metadata: Metadata = {
  title: "FramSat-1 live tracker | Freider Fløan",
  description,
  alternates: {
    canonical: "/framsat",
    languages: { en: "/framsat", nb: "/no/framsat", "x-default": "/framsat" },
  },
  openGraph: {
    title: "FramSat-1 live tracker",
    description,
    url: "/framsat",
    siteName: "Freider Fløan",
    type: "website",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image", title: "FramSat-1 live tracker", description },
};

export default function Page() {
  return <FramsatPage lang="en" />;
}
