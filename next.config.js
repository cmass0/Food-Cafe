/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@supabase/ssr", "@supabase/supabase-js"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "vtkcngubofjqddqvcufp.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

module.exports = nextConfig;
