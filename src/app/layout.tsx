import type { Metadata } from "next";
import { Geist_Mono, Syne } from "next/font/google";
import { Backdrop } from "./backdrop";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
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
      className={`${syne.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Backdrop />
        {children}
      </body>
    </html>
  );
}
