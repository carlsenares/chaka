import type { NextConfig } from "next";

// standalone output → minimal production image (see Dockerfile)
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
