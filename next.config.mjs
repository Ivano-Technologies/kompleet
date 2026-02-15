// next.config.mjs
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Ensure proper TypeScript checking
  typescript: {
    ignoreBuildErrors: false,
  },

  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  poweredByHeader: false,
  compress: true,

  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  // Configure headers for deep linking well-known files
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/aida-public/**",
      },
      {
        protocol: "https",
        hostname: "files.manuscdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "private-us-east-1.manuscdn.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default withSentryConfig(
  nextConfig,
  {
    org: "ivano-technologies",
    project: "kompleet-platform",
    authToken: process.env.SENTRY_AUTH_TOKEN,
    widenClientFileUpload: true,
    silent: !process.env.CI,
    disableLogger: true,
    tunnelRoute: "/monitoring",
    autoInstrumentServerFunctions: true,
    hideSourceMaps: true,
  }
);
