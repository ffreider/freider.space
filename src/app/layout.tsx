import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Freider Fløan",
  description: "Co-founder and President of NORSTEC. Host of Spacepodden. Building for the Norwegian space ecosystem.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Slowly drifting color fields with film grain on top */}
        <div aria-hidden className="backdrop">
          <div className="blob blob-teal" />
          <div className="blob blob-blue" />
          <div className="blob blob-magenta" />
          <div className="grain" />
        </div>
        {children}
      </body>
    </html>
  );
}
