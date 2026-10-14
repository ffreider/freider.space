import type { Metadata, Viewport } from "next";
import { ContactCard } from "@/app/contact/contact-card";
import { CARDS } from "@/lib/contact";

// Kept out of search results: it's for people who were handed the link.
export const metadata: Metadata = {
  title: "Freider Fløan | Meso Manufacturing",
  description: "Save my Meso Manufacturing contact details.",
  alternates: { canonical: "/meso", languages: {} },
  robots: { index: false, follow: true },
  openGraph: { title: "Freider Fløan, Meso Manufacturing", description: "Save my contact details.", url: "/meso", type: "profile" },
  twitter: { card: "summary_large_image", title: "Freider Fløan, Meso Manufacturing", description: "Save my contact details." },
};

export const viewport: Viewport = { themeColor: "#000000" };

// Tonight's Moon in the corner, as in the browser tab; redrawn every 6 hours.
export const revalidate = 21600;

export default function MesoPage() {
  return <ContactCard card={CARDS.meso} />;
}
