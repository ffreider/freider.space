import type { Metadata, Viewport } from "next";
import { CARDS } from "@/lib/contact";
import { ContactCard } from "./contact-card";

// Kept out of search results: it's for people who were handed the link.
export const metadata: Metadata = {
  title: "Contact | Freider Fløan",
  description: "Save my contact details, call, email or connect on LinkedIn.",
  alternates: { canonical: "/contact", languages: {} },
  robots: { index: false, follow: true },
  openGraph: { title: "Freider Fløan", description: "Save my contact details.", url: "/contact", type: "profile" },
  twitter: { card: "summary_large_image", title: "Freider Fløan", description: "Save my contact details." },
};

export const viewport: Viewport = { themeColor: "#000000" };

// Tonight's Moon in the corner, as in the browser tab; redrawn every 6 hours.
export const revalidate = 21600;

export default function ContactPage() {
  return <ContactCard card={CARDS.personal} />;
}
