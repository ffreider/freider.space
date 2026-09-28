import type { MetadataRoute } from "next";

// Everyone may crawl everything, including AI assistants' crawlers, which
// are listed by name so there's no doubt they're welcome.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-User",
          "Claude-SearchBot",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
        ],
        allow: "/",
      },
    ],
    sitemap: "https://freider.space/sitemap.xml",
    host: "https://freider.space",
  };
}
