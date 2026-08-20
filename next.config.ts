import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ffmpeg-static", "fluent-ffmpeg"],
  outputFileTracingIncludes: {
    "/api/projects": ["./node_modules/ffmpeg-static/**"],
  },
};

export default nextConfig;
