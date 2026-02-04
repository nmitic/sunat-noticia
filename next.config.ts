import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent bundling of pg so its native TLS/SSL handling works correctly
  serverExternalPackages: ["pg"],
};

export default nextConfig;
