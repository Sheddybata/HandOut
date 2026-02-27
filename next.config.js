/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Allow heavy PDF dependencies to run outside the bundled server runtime
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist", "@supabase/supabase-js"],
  },
};

module.exports = nextConfig;
