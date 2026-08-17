import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with only the files needed to run the server, so the
  // Docker runtime image doesn't need node_modules copied in wholesale.
  output: "standalone",
};

export default nextConfig;
