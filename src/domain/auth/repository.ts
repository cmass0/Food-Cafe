import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

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

// 가입 이메일로 비밀번호 복구 링크를 발송한다.
export async function sendPasswordResetEmail(
  client: ServerSupabase,
  email: string,
  redirectTo: string
): Promise<void> {
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) throw error;
}

// 복구 링크로 발급된 인증 세션에서 새 비밀번호를 설정한다.
export async function updateRecoveredPassword(
  client: ServerSupabase,
  newPassword: string
): Promise<void> {
  const { error } = await client.auth.updateUser({ password: newPassword });

  if (error) throw error;
}

// 복구가 끝난 브라우저의 세션을 종료해 새 비밀번호로 다시 로그인하게 한다.
export async function signOutAfterRecovery(client: ServerSupabase): Promise<void> {
  const { error } = await client.auth.signOut({ scope: "local" });

  if (error && error.code !== "session_not_found") throw error;
}

// 로그인한 계정에 새 휴대폰 번호를 연결하고 Supabase Auth가 SMS OTP를 발송하게 한다.
export async function requestPhoneChange(client: ServerSupabase, phone: string): Promise<void> {
  const { error } = await client.auth.updateUser({ phone });

  if (error) throw error;
}

// phone_change OTP를 검증해 인증된 전화번호를 현재 Auth 사용자에게 확정한다.
export async function verifyPhoneChange(
  client: ServerSupabase,
  phone: string,
  token: string
): Promise<User> {
  const { data, error } = await client.auth.verifyOtp({ phone, token, type: "phone_change" });

  if (error) throw error;
  if (!data.user) throw new Error("휴대폰 인증 결과에서 사용자를 확인할 수 없습니다.");
  return data.user;
}

// 기존 전화번호 계정만 SMS OTP 로그인을 요청해 미등록 번호의 자동 가입을 차단한다.
export async function requestEmailRecoveryOtp(
  client: ServerSupabase,
  phone: string
): Promise<void> {
  const { error } = await client.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: false },
  });

  if (error) throw error;
}

// 이메일 찾기용 SMS OTP를 검증하고 해당 Auth 사용자를 반환한다.
export async function verifyEmailRecoveryOtp(
  client: ServerSupabase,
  phone: string,
  token: string
): Promise<User> {
  const { data, error } = await client.auth.verifyOtp({ phone, token, type: "sms" });

  if (error) throw error;
  if (!data.user) throw new Error("휴대폰 인증 결과에서 사용자를 확인할 수 없습니다.");
  return data.user;
}
