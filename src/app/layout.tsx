import type { Metadata } from "next";
import {
  Archivo,
  Geist_Mono,
  IBM_Plex_Mono,
  JetBrains_Mono,
  Schibsted_Grotesk,
  Syne,
  Unbounded,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { framsatTle } from "@/lib/framsat-tle";
import { recentReceptions } from "@/lib/satnogs";
import { Backdrop } from "./backdrop";
import { LaunchEasterEgg } from "./launch";
import { StudySwitcher } from "./study-switcher";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fonts for the design studies (see globals.css).
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin"], weight: "600" });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });
const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"] });

const fontVariables = [syne, geistMono, unbounded, archivo, plexMono, jetbrains, schibsted]
  .map((font) => font.variable)
  .join(" ");

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
      className={`dark ${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Backdrop tle={tle} stations={stations} />
        {children}
        <LaunchEasterEgg />
        <StudySwitcher />
        <Analytics />
      </body>
    </html>
  );
}
