import "server-only";

import type { Database } from "@/types/supabase";
import { createClient } from "@supabase/supabase-js";

// service role key를 사용하는 관리자 전용 클라이언트
// RLS를 우회하므로 서버 사이드에서만 사용할 것 (auth.admin.deleteUser 등)
export function getAdminSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
