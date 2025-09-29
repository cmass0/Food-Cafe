// PURPOSE: 브라우저(클라이언트) Supabase 클라이언트 스켈레톤
// NOTE: 구현은 추후 진행. 여기서는 파일 구조만 생성합니다.
// - NEXT_PUBLIC_SUPABASE_URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY
// 를 사용해 createBrowserClient 구성 예정.
import type {SupabaseClient} from "@supabase/supabase-js"

import { createBrowserClient } from "@supabase/ssr";

let client: SupabaseClient |null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
