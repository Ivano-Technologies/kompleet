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
        permanent: false,
      },
      { source: "/app", destination: "/dashboard", permanent: false },
      { source: "/app/dashboard", destination: "/dashboard", permanent: false },
      {
        source: "/app/transactions",
        destination: "/transactions",
        permanent: false,
      },
      { source: "/app/:path*", destination: "/dashboard", permanent: false },
      { source: "/filing", destination: "/tax?tab=filing", permanent: false },
      {
        source: "/tax-reports",
        destination: "/tax?tab=reports",
        permanent: false,
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

  // pdfjs Node fake-worker dynamically imports pdf.worker.mjs (webpackIgnore).
  // NFT drops that file unless we include it — Preview then 400s ubaLayout.
  outputFileTracingIncludes: {
    "/api/transactions/upload-v2": [
      "./node_modules/pdfjs-dist/legacy/build/**",
      "./node_modules/pdfjs-dist/build/**",
      "./node_modules/@napi-rs/canvas/**",
    ],
    "/src/app/api/transactions/upload-v2/route": [
      "./node_modules/pdfjs-dist/legacy/build/**",
      "./node_modules/pdfjs-dist/build/**",
      "./node_modules/@napi-rs/canvas/**",
    ],
  },

  // pdf-parse / pdfjs need the native canvas addon at runtime on Vercel.
  // Bundling it drops the .node binary and getText() throws DOMMatrix.
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist", "pdf-parse"],

  webpack: (config, { isServer }) => {
    // natural pulls in classifiers that require webworker-threads (optional native);
    // we only use PorterStemmer. Stub so build does not fail resolving it.
    config.resolve ??= {};
    config.resolve.fallback ??= {};
    config.resolve.fallback["webworker-threads"] = false;
    // unzipper optionally requires @aws-sdk/client-s3 for S3-backed opens.
    // We never use that path; AWS SDK was removed with the ML tier.
    config.resolve.fallback["@aws-sdk/client-s3"] = false;
    return config;
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
    // Disable all source map uploads to avoid Edge build crash (Sentry reads .length on undefined manifest)
    sourcemaps: { disable: true },
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

