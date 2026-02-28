/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Allow heavy PDF dependencies to run outside the bundled server runtime
    serverComponentsExternalPackages: ["unpdf", "@supabase/supabase-js"],
  },
};

module.exports = nextConfig;
