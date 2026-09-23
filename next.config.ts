import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
    let backendOrigin = "http://localhost:4000";
    try {
      backendOrigin = new URL(rawApiUrl).origin;
    } catch {
      // fallback
    }

    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
