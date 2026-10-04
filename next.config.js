/** @type {import('next').NextConfig} */
const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const configuredStorageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim();

// 이미지 최적화는 우리 Supabase Storage 버킷의 공개 파일만 받는다.
// 허용 범위가 넓을수록 이미지 최적화 취약점(SSRF 등)이 나왔을 때 공격에 쓸 수 있는 주소가 늘어난다.
const supabaseImagePattern = (() => {
  if (!configuredSupabaseUrl || !configuredStorageBucket) return null;

  const url = new URL(configuredSupabaseUrl);
  return {
    protocol: url.protocol.replace(":", ""),
    hostname: url.hostname,
    ...(url.port ? { port: url.port } : {}),
    pathname: `/storage/v1/object/public/${encodeURIComponent(configuredStorageBucket)}/**`,
  };
})();

const nextConfig = {
  serverExternalPackages: ["@supabase/ssr", "@supabase/supabase-js", "undici"],
  images: {
    remotePatterns: supabaseImagePattern ? [supabaseImagePattern] : [],
  },
};

module.exports = nextConfig;
