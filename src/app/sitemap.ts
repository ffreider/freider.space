import type { MetadataRoute } from "next";

// Each page in both languages, pointing at its other-language version.
export default function sitemap(): MetadataRoute.Sitemap {
  const site = "https://freider.space";
  const home = { en: site, nb: `${site}/no` };
  const framsat = { en: `${site}/framsat`, nb: `${site}/no/framsat` };
  return [
    { url: home.en, changeFrequency: "monthly", priority: 1, alternates: { languages: home } },
    { url: home.nb, changeFrequency: "monthly", priority: 0.9, alternates: { languages: home } },
    { url: framsat.en, changeFrequency: "daily", priority: 0.8, alternates: { languages: framsat } },
    { url: framsat.nb, changeFrequency: "daily", priority: 0.7, alternates: { languages: framsat } },
  ];
}
