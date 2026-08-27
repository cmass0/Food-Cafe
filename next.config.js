/** @type {import('next').NextConfig} */
const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseImagePattern = (() => {
  if (!configuredSupabaseUrl) return null;

  const url = new URL(configuredSupabaseUrl);
  return {
    protocol: url.protocol.replace(":", ""),
    hostname: url.hostname,
    ...(url.port ? { port: url.port } : {}),
  };
})();

const nextConfig = {
  serverExternalPackages: ["@supabase/ssr", "@supabase/supabase-js"],
  images: {
    remotePatterns: [
      ...(supabaseImagePattern ? [supabaseImagePattern] : []),
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

module.exports = nextConfig;
