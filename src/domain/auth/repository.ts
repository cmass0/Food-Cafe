import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

type ServerSupabase = SupabaseClient<Database>;

// 이메일 변경 요청과 확인 메일 발송은 Supabase Auth가 담당한다.
export async function requestEmailChange(
  client: ServerSupabase,
  email: string,
  emailRedirectTo: string
): Promise<void> {
  const { error } = await client.auth.updateUser({ email }, { emailRedirectTo });

  if (error) throw error;
}

// 현재 비밀번호 확인과 새 비밀번호 변경을 하나의 Auth 요청으로 처리한다.
export async function changePassword(
  client: ServerSupabase,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const { error } = await client.auth.updateUser({
    current_password: currentPassword,
    password: newPassword,
  });

  if (error) throw error;
}
