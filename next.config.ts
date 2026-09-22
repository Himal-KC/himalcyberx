import type { NextConfig } from "next";
import {
  buildSecurityHeaders,
  getSupabaseImageRemotePatterns,
} from "@/lib/security/headers";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: getSupabaseImageRemotePatterns(),
  },
  experimental: {
    serverActions: {
      // Avatar max is 1 MB; multipart encoding needs headroom above that.
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: buildSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;
