import type { Metadata } from "next";
import { IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { framsatTle } from "@/lib/framsat-tle";
import { recentReceptions } from "@/lib/satnogs";
import { Backdrop } from "./backdrop";
import { LaunchEasterEgg } from "./launch";
import "./globals.css";

const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// What search results show (title and description) is descriptive; link
// previews (Open Graph) show the tagline.
const tagline = "I like starting things, mostly about space.";

export const metadata: Metadata = {
  metadataBase: new URL("https://freider.space"),
  title: "Freider Fløan | Space, NORSTEC and Spacepodden",
  description:
    "Freider Fløan studies electronic systems design and space systems at NTNU in Trondheim, co-founded and leads NORSTEC, and hosts the Norwegian space podcast Spacepodden.",
  openGraph: {
    title: "Freider Fløan",
    description: tagline,
    url: "/",
    siteName: "Freider Fløan",
    type: "profile",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image", title: "Freider Fløan", description: tagline },
  alternates: { canonical: "/", languages: { en: "/", nb: "/no" } },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [tle, stations] = await Promise.all([framsatTle(), recentReceptions()]);

  return (
    <html
      lang="en"
      className={`${schibsted.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Backdrop tle={tle} stations={stations} />
        {children}
        <LaunchEasterEgg />
        <Analytics />
      </body>
    </html>
  );
}
