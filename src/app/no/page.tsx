import type { Metadata } from "next";
import { Home } from "../home";

// Search results get a descriptive title and description; link previews
// (Open Graph) get the tagline.
const tagline = "Jeg liker å starte ting, mest innen romfart.";

export const metadata: Metadata = {
  title: "Freider Fløan | Romfart, NORSTEC og Spacepodden",
  description:
    "Freider Fløan studerer elektronisk systemdesign og romsystemer ved NTNU i Trondheim, er medgründer og president i NORSTEC, og programleder for romfartspodkasten Spacepodden.",
  alternates: { canonical: "/no", languages: { en: "/", nb: "/no", "x-default": "/" } },
  openGraph: {
    title: "Freider Fløan",
    description: tagline,
    url: "/no",
    siteName: "Freider Fløan",
    type: "profile",
    locale: "nb_NO",
  },
  twitter: { card: "summary_large_image", title: "Freider Fløan", description: tagline },
};

export default function Page() {
  return <Home lang="no" />;
}
