import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Supabase 데이터 조회(PostgREST)가 돌려준 오류인지 판별한다.
 *
 * REST 서버가 만든 오류에는 code가 있지만, 앞단 게이트웨이가 대신 답하면 code 없이 message만 온다
 * (supabase-js는 응답 본문을 그대로 오류로 돌려준다). 이런 오류도 Supabase 오류로 봐야
 * respondWithSupabaseError가 503으로 답한다. 놓치면 API가 "서버 버그"(500)로 잘못 답했다(DB 장애 테스트에서 발견).
 * 반대로 우리 코드가 던진 Error는 code가 없으면 Supabase 오류로 보지 않는다. 진짜 버그를 503으로 숨기지 않기 위해서다.
 * 그래서 게이트웨이 오류처럼 code가 없을 수 있다는 점은 PostgrestError 타입과 다르다.
 */
export const isPostgrestError = (error: unknown): error is PostgrestError => {
  if (typeof error !== "object" || error === null) return false;
  if (typeof (error as { code?: unknown }).code === "string") return true;
  return !(error instanceof Error) && typeof (error as { message?: unknown }).message === "string";
};

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
