// PURPOSE: 서버 액션/Route Handler/Server Component 용 Supabase 클라이언트 스켈레톤
// NOTE: 구현은 추후 진행. 여기서는 파일 구조만 생성합니다.
// - 쿠키 기반 세션 전파(createServerClient) 예정
// - 변이(INSERT/UPDATE/DELETE)는 서버에서만 실행 원칙

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type ServerClient = ReturnType<typeof createServerClient /*<Database>*/>;

export function getServerSupabase(): ServerClient {
  const store = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("[server] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        store.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        store.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}
