import type { Metadata } from "next";
import { Geist_Mono, Syne } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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

const description =
  "Co-founder and President of NORSTEC. Host of Spacepodden. Building for the Norwegian space ecosystem.";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Backdrop />
        {children}
        <LaunchEasterEgg />
        <Analytics />
      </body>
    </html>
  );
}
