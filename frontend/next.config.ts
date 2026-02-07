import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERSION: process.env.npm_package_version || "1.0.0",
    NEXT_PUBLIC_COMMIT: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || "local",
  },
};

export default nextConfig;
// Deploy trigger
