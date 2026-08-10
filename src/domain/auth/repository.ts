import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

type ServerSupabase = SupabaseClient<Database>;

// 현재 로그인 이메일과 비밀번호로 다시 인증해 계정 비밀번호가 맞는지 확인한다.
export async function verifyCurrentPassword(
  client: ServerSupabase,
  email: string,
  password: string
): Promise<string> {
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) throw error;
  if (!data.user) throw new Error("비밀번호 확인 결과에서 사용자를 찾을 수 없습니다.");

  return data.user.id;
}

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
