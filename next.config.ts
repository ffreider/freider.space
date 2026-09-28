import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Spacepodden episode cover art, from the podcast's RSS feed
    remotePatterns: [{ protocol: "https", hostname: "media.rss.com" }],
  },
};

export default nextConfig;
