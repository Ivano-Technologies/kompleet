/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Ensure proper TypeScript checking
  typescript: {
    // Fail build on type errors
    ignoreBuildErrors: false,
  },

  // Ensure proper ESLint checking
  eslint: {
    // Fail build on lint errors
    ignoreDuringBuilds: false,
  },

  // Environment variables validation
  // Next.js will validate these are present at build time
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
    domains: [], // Add allowed image domains here
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;
