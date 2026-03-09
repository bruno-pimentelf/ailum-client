import type { NextConfig } from "next";

// Use a separate distDir for dev so the Turbopack RocksDB cache
// (.next-dev/cache/turbopack-tasks-backend) is never wiped when running
// `rm -rf .next` between builds.  Production builds still write to `.next`.
const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
};

export default nextConfig;
