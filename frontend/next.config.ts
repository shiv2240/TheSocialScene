import type { NextConfig } from "next";

const PUBLIC_PAGE_CACHE = "public, s-maxage=30, stale-while-revalidate=120";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*\\.(js|css|woff|woff2|ttf|otf|ico|png|jpg|jpeg|svg|webp|avif)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/api/search",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=30, stale-while-revalidate=60" },
        ],
      },
      {
        source: "/events",
        headers: [{ key: "Cache-Control", value: PUBLIC_PAGE_CACHE }],
      },
      {
        source: "/events/:slug",
        headers: [{ key: "Cache-Control", value: PUBLIC_PAGE_CACHE }],
      },
      {
        source: "/categories",
        headers: [{ key: "Cache-Control", value: PUBLIC_PAGE_CACHE }],
      },
      {
        source: "/categories/:slug",
        headers: [{ key: "Cache-Control", value: PUBLIC_PAGE_CACHE }],
      },
      {
        source: "/venues",
        headers: [{ key: "Cache-Control", value: PUBLIC_PAGE_CACHE }],
      },
      {
        source: "/how-it-works",
        headers: [{ key: "Cache-Control", value: PUBLIC_PAGE_CACHE }],
      },
      {
        source: "/become-a-host",
        headers: [{ key: "Cache-Control", value: PUBLIC_PAGE_CACHE }],
      },
      {
        source: "/login",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },

  experimental: {
    optimizePackageImports: ["lucide-react"],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
