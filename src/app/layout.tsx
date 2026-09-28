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

const description = "I like starting things, mostly about space.";

export const metadata: Metadata = {
  metadataBase: new URL("https://freider.space"),
  title: "Freider Fløan",
  description,
  openGraph: {
    title: "Freider Fløan",
    description,
    url: "/",
    siteName: "Freider Fløan",
    type: "profile",
  },
  twitter: { card: "summary_large_image" },
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
