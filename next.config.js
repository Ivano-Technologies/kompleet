/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Ensure proper TypeScript checking
  typescript: {
    // Fail build on type errors
    ignoreBuildErrors: false,
  },

  // Environment variables validation
  env: {
    // Public variables (safe for client)
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Optimize for production
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression

  // Image optimization (if needed later)
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
