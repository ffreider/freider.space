import type { MetadataRoute } from "next";

// Both language versions, each pointing at the other.
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { en: "https://freider.space", nb: "https://freider.space/no" };
  return [
    { url: languages.en, changeFrequency: "monthly", priority: 1, alternates: { languages } },
    { url: languages.nb, changeFrequency: "monthly", priority: 0.9, alternates: { languages } },
  ];
}
