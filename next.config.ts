import type { NextConfig } from "next";
import {
  buildSecurityHeaders,
  getSupabaseImageRemotePatterns,
} from "@/lib/security/headers";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: getSupabaseImageRemotePatterns(),
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
