import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type ServerClient = SupabaseClient<Database>;

export async function getServerSupabase(): Promise<ServerClient> {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) {
    throw new Error(
      "[server] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  // 게시글·레시피·조합 쓰기는 이 헤더가 있는 요청만 RLS가 받는다(private.is_app_server).
  // 값이 없으면 헤더를 보내지 않아 조회는 그대로 되고 콘텐츠 쓰기만 거절된다(fail-closed).
  const appServerKey = process.env.SUPABASE_APP_SERVER_KEY;

  return createServerClient<Database>(url, anon, {
    ...(appServerKey ? { global: { headers: { "x-app-server-key": appServerKey } } } : {}),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {}
      },
    },
  });
}
