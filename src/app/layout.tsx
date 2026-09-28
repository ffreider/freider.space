import type { Metadata } from "next";
import { Geist_Mono, Syne } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { framsatTle } from "@/lib/framsat-tle";
import { Backdrop } from "./backdrop";
import { LaunchEasterEgg } from "./launch";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const tle = await framsatTle();

  return (
    <html
      lang="en"
      className={`dark ${syne.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Backdrop tle={tle} />
        {children}
        <LaunchEasterEgg />
        <Analytics />
      </body>
    </html>
  );
}
