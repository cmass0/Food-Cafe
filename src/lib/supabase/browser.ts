// PURPOSE: 브라우저(클라이언트) Supabase 클라이언트 스켈레톤
// NOTE: 구현은 추후 진행. 여기서는 파일 구조만 생성합니다.
// - NEXT_PUBLIC_SUPABASE_URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY
// 를 사용해 createBrowserClient 구성 예정.
// src/lib/supabase/browser.ts
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type BrowserClient = ReturnType<typeof createBrowserClient>;

const globalForSupabase = globalThis as unknown as { _sbBrowser?: BrowserClient };

export function getBrowserSupabase(): BrowserClient {
  if (!globalForSupabase._sbBrowser) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) throw new Error("[browser] missing env");
    globalForSupabase._sbBrowser = createBrowserClient(url, anon);
  }
  return globalForSupabase._sbBrowser!;
}
