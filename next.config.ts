import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/projects": ["./node_modules/ffmpeg-static/**"],
  },
};

export default nextConfig;
