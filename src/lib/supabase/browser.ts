import type { Database } from "@/types/supabase";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export type BrowserSupabaseClient = SupabaseClient<Database>;

let browserClient: BrowserSupabaseClient | undefined;

export function getBrowserSupabase(): BrowserSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("[browser] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  // Client Component도 서버에서 사전 렌더링될 수 있으므로 서버 프로세스 전역에는
  // 인증 클라이언트를 보관하지 않는다. 실제 브라우저에서만 한 인스턴스를 재사용한다.
  if (typeof window !== "undefined" && browserClient) return browserClient;

  const client = createBrowserClient<Database>(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  if (typeof window !== "undefined") browserClient = client;
  return client;
}
