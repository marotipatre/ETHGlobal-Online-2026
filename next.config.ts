import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Vercel: public/ is read-only at runtime. Intent history and health
  // are written by the relayer running separately. The API routes serve
  // the files if present and return safe empty defaults if not.
};

export default nextConfig;
