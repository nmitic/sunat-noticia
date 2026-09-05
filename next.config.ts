import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // The feed moved from / to /noticias when / became the status page. These
    // run ahead of the filesystem, so an old link costs no render, and the 308
    // lets search engines consolidate onto the new URL. Query values ride along
    // to the destination automatically, so ?flags=URGENTE survives the hop.
    return [
      {
        source: "/",
        has: [{ type: "query", key: "flags" }],
        destination: "/noticias",
        permanent: true,
      },
      {
        source: "/",
        has: [{ type: "query", key: "category" }],
        destination: "/noticias",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' http://localhost:5173 https://app.perunio.pe",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
