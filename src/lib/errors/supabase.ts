import type { PostgrestError } from "@supabase/supabase-js";

/** Supabase 데이터 조회(PostgREST)가 돌려준 오류인지 판별한다. */
export const isPostgrestError = (error: unknown): error is PostgrestError =>
  typeof (error as PostgrestError)?.code === "string";

/**
 * 요청한 페이지가 전체 행 수를 넘었을 때 PostgREST가 돌려주는 오류(PGRST103)인지 판별한다.
 * 장애가 아니라 "없는 페이지"이므로 일반 조회 실패와 구분해 처리한다.
 */
export function isPageOutOfRangeError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as { code?: unknown }).code === "PGRST103";
}

/** 로그인 세션이 없어서 Supabase Auth가 돌려준 오류인지 판별한다. */
export function isAuthSessionMissingError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AuthSessionMissingError" || error.message === "Auth session missing!")
  );
}
