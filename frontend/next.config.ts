import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // Determine the API URL depending on the environment
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`, // Proxy to Backend API
      },
      {
        source: "/oauth2/:path*",
        destination: `${backendUrl}/oauth2/:path*`, // Proxy OAuth Start
      },
      {
        source: "/login/oauth2/:path*",
        destination: `${backendUrl}/login/oauth2/:path*`, // Proxy OAuth Callback
      }
    ];
  },
};

export default nextConfig;
