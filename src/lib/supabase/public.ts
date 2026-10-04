import "server-only";

import type { Database } from "@/types/supabase";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerFetch } from "./server-fetch";

let publicClient: SupabaseClient<Database> | null = null;

// 로그인 정보 없이 비로그인 사용자 권한으로 묻는 서버 클라이언트.
// 여러 사용자가 같이 쓰는 캐시는 요청한 사람의 권한으로 채우면 그 결과가 다른 사람에게도 보이므로 이 클라이언트로 채운다.
// 쿠키를 읽지 않아 요청마다 새로 만들 이유가 없으므로 하나를 만들어 계속 쓴다.
export function getPublicSupabase(): SupabaseClient<Database> {
  if (publicClient) return publicClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("[server] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  publicClient = createClient<Database>(url, anon, {
    global: { fetch: getSupabaseServerFetch() },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return publicClient;
}
