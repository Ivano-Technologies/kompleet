// next.config.mjs
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  poweredByHeader: false,
  compress: true,

  async redirects() {
    return [
      {
        source: "/dashboard/overview",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },

  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  webpack: (config, { isServer }) => {
    // natural pulls in classifiers that require webworker-threads (optional native);
    // we only use PorterStemmer. Stub so build does not fail resolving it.
    config.resolve ??= {};
    config.resolve.fallback ??= {};
    config.resolve.fallback["webworker-threads"] = false;
    return config;
  },

  async redirects() {
    return [
      {
        source: '/dashboard/overview',
        destination: '/dashboard',
        permanent: false,
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
    silent: !process.env.CI,
    telemetry: false,
    tunnelRoute: "/monitoring",
    disableClientSourceMaps: true,
    disableServerSourceMaps: true,
    webpack: {
      autoInstrumentServerFunctions: false,
      treeshake: {
        removeDebugLogging: true,
      },
    },
  },
  {
    widenClientFileUpload: true,
    hideSourceMaps: true,
  }
);

