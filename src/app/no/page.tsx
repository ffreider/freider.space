import type { Metadata } from "next";
import { Home } from "../home";

const description = "Jeg liker å starte ting, mest innen romfart.";

export const metadata: Metadata = {
  description,
  alternates: { canonical: "/no", languages: { en: "/", nb: "/no" } },
  openGraph: {
    title: "Freider Fløan",
    description,
    url: "/no",
    siteName: "Freider Fløan",
    type: "profile",
    locale: "nb_NO",
  },
};

export default function Page() {
  return <Home lang="no" />;
}
