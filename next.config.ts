import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Pexels already serves compressed assets; skip /_next/image proxy
    // (was timing out at 7–8s and blocking page feel).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
    minimumCacheTTL: 86400,
  },
};

export default nextConfig;
