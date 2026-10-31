import type { MetadataRoute } from "next";

// Everyone may crawl everything, including AI assistants' crawlers, which
// are listed by name so there's no doubt they're welcome. The exceptions are
// images drawn on the server, which cost seconds of CPU each and have
// nothing to read: crawlers working through every postcard's print image
// used up the month's Hobby CPU on 29–31 Oct 2026. A crawler obeys only the
// group that names it, so both groups list them.
const disallow = ["/postcard/*/print", "/postcard/*/card.png", "/framsat/log/waterfall/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
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
        disallow,
      },
    ],
    sitemap: "https://freider.space/sitemap.xml",
    host: "https://freider.space",
  };
}
