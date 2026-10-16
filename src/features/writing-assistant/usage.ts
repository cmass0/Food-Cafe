import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { MAX_CALLS_PER_SESSION, MAX_DAILY_SESSIONS } from "./limits";

type AdminClient = SupabaseClient<Database>;

// 개발 중에만 사용 제한을 끈다. 운영(production)에서는 환경 변수가 있어도 무시한다.
export function isWritingLimitDisabled(env: Partial<Record<string, string>> = process.env) {
  return env.NODE_ENV !== "production" && env.WRITING_ASSISTANT_DISABLE_LIMIT === "true";
}

// 아래 함수는 서버 전용 RPC(service_role)로만 사용 기록을 읽고 바꾼다. 사용자 ID는 서버 세션에서 꺼낸 값만 넘긴다.
export async function countRemainingSessions(admin: AdminClient, userId: string) {
  if (isWritingLimitDisabled()) return MAX_DAILY_SESSIONS;
  const { data, error } = await admin.rpc("count_writing_assistant_sessions_today", {
    p_user_id: userId,
  });
  if (error) throw error;
  return Math.max(0, MAX_DAILY_SESSIONS - (data ?? 0));
}

// 오늘 시작 횟수가 남았으면 새 대화 ID를, 아니면 null을 오늘 남은 시작 횟수와 함께 돌려준다.
export async function startWritingSession(
  admin: AdminClient,
  userId: string
): Promise<{ sessionId: string | null; remaining: number }> {
  if (isWritingLimitDisabled()) {
    return { sessionId: crypto.randomUUID(), remaining: MAX_DAILY_SESSIONS };
  }
  const { data, error } = await admin.rpc("start_writing_assistant_session", {
    p_user_id: userId,
    p_max_sessions: MAX_DAILY_SESSIONS,
  });
  if (error) throw error;
  const row = data?.[0];
  return { sessionId: row?.session_id ?? null, remaining: Math.max(0, row?.remaining ?? 0) };
}

// 대화에서 AI를 한 번 더 부를 수 있으면 호출 수를 올리고 true를 돌려준다.
export async function consumeWritingCall(admin: AdminClient, sessionId: string, userId: string) {
  if (isWritingLimitDisabled()) return true;
  const { data, error } = await admin.rpc("use_writing_assistant_call", {
    p_session_id: sessionId,
    p_user_id: userId,
    p_max_calls: MAX_CALLS_PER_SESSION,
  });
  if (error) throw error;
  return data !== null;
}

// 서버·AI 오류로 실패한 호출을 되돌린다.
export async function refundWritingCall(admin: AdminClient, sessionId: string, userId: string) {
  if (isWritingLimitDisabled()) return;
  const { error } = await admin.rpc("refund_writing_assistant_call", {
    p_session_id: sessionId,
    p_user_id: userId,
  });
  if (error) throw error;
}
