import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, IBM_Plex_Mono, Newsreader, Schibsted_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });
// The homepage's reading text (a serif with optical sizes), and the two faces
// of its "ground station" style study, loaded only when that style is used.
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"] });
const barlowCond = Barlow_Condensed({ variable: "--font-barlow-cond", subsets: ["latin"], weight: ["500", "600", "700"], preload: false });
const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["400", "500"], preload: false });

// What search results show (title and description) is descriptive; link
// previews (Open Graph) show the tagline.
const tagline = "I like starting things, mostly about space.";

export const metadata: Metadata = {
  metadataBase: new URL("https://freider.space"),
  title: "Freider Fløan | Space, NORSTEC and Spacepodden",
  description:
    "Freider Fløan: co-founder and board member of NORSTEC, host of the space podcast Spacepodden and space systems student at NTNU. Follow FramSat-1 live.",
  openGraph: {
    title: "Freider Fløan",
    description: tagline,
    url: "/",
    siteName: "Freider Fløan",
    type: "profile",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image", title: "Freider Fløan", description: tagline },
  alternates: { canonical: "/", languages: { en: "/", nb: "/no", "x-default": "/" } },
  // Ownership checks for search engines' webmaster tools.
  verification: { other: { "msvalidate.01": "5A909B27A73DEDBB10036542303E740A" } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${schibsted.variable} ${plexMono.variable} ${newsreader.variable} ${barlowCond.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
