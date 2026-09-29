import Link from "next/link";
import { framsatTle } from "@/lib/framsat-tle";
import { recentReceptions } from "@/lib/satnogs";
import { FramsatSection } from "./framsat";
import { TEXT } from "./home";
import type { Lang } from "./i18n";

// The FramSat-1 tracker on a page of its own (/framsat and /no/framsat), so
// it can be found and linked to directly. The background globe opens up
// fully because the section starts at the top of the page.

const NAV = {
  en: { home: "/", other: { label: "Norsk", href: "/no/framsat", lang: "nb" } },
  no: { home: "/no", other: { label: "English", href: "/framsat", lang: "en" } },
};

function structuredData(lang: Lang) {
  const site = "https://freider.space";
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: lang === "no" ? "FramSat-1 direkte" : "FramSat-1 live tracker",
    url: lang === "no" ? `${site}/no/framsat` : `${site}/framsat`,
    inLanguage: lang === "no" ? "nb" : "en",
    author: { "@type": "Person", "@id": `${site}/#person`, name: "Freider Fløan" },
    about: {
      "@type": "Thing",
      name: "FramSat-1",
      alternateName: "FS-1",
      identifier: "NORAD 98914",
      description:
        lang === "no"
          ? "Studentsatellitt fra Orbit NTNU, skutt opp 5. september 2026."
          : "Student satellite from Orbit NTNU, launched on 5 September 2026.",
      sameAs: [
        "https://orbitntnu.com/projects/FramSat-1",
        "https://db.satnogs.org/satellite/BXJV-0815-0756-1233-1493",
      ],
    },
  };
}

export async function FramsatPage({ lang }: { lang: Lang }) {
  const [tle, receptions] = await Promise.all([framsatTle(), recentReceptions()]);
  const nav = NAV[lang];

  return (
    <div lang={lang === "no" ? "nb" : "en"} className="contents">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(lang)) }}
      />
      <nav className="flex w-full items-baseline justify-between px-6 pt-6 text-sm sm:px-8">
        <Link href={nav.home} className="display text-base">
          Freider Fløan
        </Link>
        <Link href={nav.other.href} hrefLang={nav.other.lang} lang={nav.other.lang} className="text-fg-3 hover:text-fg">
          {nav.other.label}
        </Link>
      </nav>

      <FramsatSection tle={tle} receptions={receptions} lang={lang} standalone />

      <footer className="mx-auto w-full max-w-3xl px-6 pb-12 sm:px-8">
        <p className="text-xs text-fg-4">{TEXT[lang].privacy}</p>
      </footer>
    </div>
  );
}
