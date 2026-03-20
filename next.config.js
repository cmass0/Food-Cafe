/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@supabase/ssr", "@supabase/supabase-js"],
  },
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "vtkcngubofjqddqvcufp.supabase.co",
      "images.unsplash.com",
    ],
  },
};

module.exports = nextConfig;
