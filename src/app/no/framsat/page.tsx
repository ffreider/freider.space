import type { Metadata } from "next";
import { FramsatPage } from "../../framsat-page";

const description =
  "Hvor Orbit NTNU sin studentsatellitt FramSat-1 er akkurat nå: posisjonen direkte på en jordklode, passeringer over Trondheim, dopplerskift, mottak fra SatNOGS og en forklart TLE.";

export const metadata: Metadata = {
  title: "FramSat-1 direkte | Freider Fløan",
  description,
  alternates: {
    canonical: "/no/framsat",
    languages: { en: "/framsat", nb: "/no/framsat", "x-default": "/framsat" },
  },
  openGraph: {
    title: "FramSat-1 direkte",
    description,
    url: "/no/framsat",
    siteName: "Freider Fløan",
    type: "website",
    locale: "nb_NO",
  },
  twitter: { card: "summary_large_image", title: "FramSat-1 direkte", description },
};

export default function Page() {
  return <FramsatPage lang="no" />;
}
