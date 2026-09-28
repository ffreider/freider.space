import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Preview image for the Trondheim.com feature (their Sanity image CDN)
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
};

export default nextConfig;
