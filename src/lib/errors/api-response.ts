import type { PostgrestError } from "@supabase/supabase-js";
import { ZodError } from "zod";
import {
  isAuthSessionMissingError,
  isPageOutOfRangeError,
  isPostgrestError,
} from "@/lib/errors/supabase";
import { getServerSupabase } from "@/lib/supabase/server";

// 서버 API 라우트가 돌려주는 오류 응답 모음. 오류 판별 자체는 ./supabase.ts에 둔다.

// 공통 JSON 응답 생성기
// json(data, 200, { "cache-control": "max-age=캐시 값" }) 형식으로 캐시 제어 가능
export const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...headers,
    },
  });

// 요청이 잘못된 게 아니라 DB 쪽이 지금 답할 수 없는 상태를 뜻하는 코드.
// PGRST00x: PostgREST가 DB에 연결하지 못함·연결 대기 초과 / 08: 연결 끊김 / 53: 연결 수·자원 부족 / 57: 쿼리 시간 초과·DB 재시작 중
const DB_UNAVAILABLE_CODE = /^(PGRST00\d|08|53|57)/;

/** Supabase 오류를 응답으로 바꾼다. context는 서버 로그에 붙일 설명이다. */
export const respondWithSupabaseError = (error: PostgrestError, context = "DB 요청 실패") => {
  // 목록 범위를 벗어난 page는 잘못된 요청이 아니라 "없는 페이지"다.
  // 레시피·조합 목록 화면은 이 404를 보고 첫 페이지 안내를 띄운다.
  if (isPageOutOfRangeError(error)) {
    return json(
      { error: "PAGE_OUT_OF_RANGE", message: "요청한 페이지에 표시할 항목이 없습니다." },
      404
    );
  }
  // 없는 페이지 말고는 원인을 로그에 남긴다. 400으로 답하는 오류도 우리 쿼리의 실수일 수 있다.
  console.error(context, error);
  // 코드가 없으면 DB 서버에 닿지 못한 것이다(연결 실패, 게이트웨이 응답).
  // 사용자 잘못이 아니므로 400이 아니라 503이고, details에 담긴 서버 내부 스택은 응답에 싣지 않는다.
  if (!error.code || DB_UNAVAILABLE_CODE.test(error.code)) {
    return json({ error: "SERVICE_UNAVAILABLE", message: "잠시 후 다시 시도해 주세요." }, 503);
  }
  const status = error.code === "42501" ? 403 : 400;
  return json(
    {
      error: error.code,
      message: error.message,
      details: error.details,
    },
    status
  );
};

// 인증 에러 매핑 헬퍼
export async function AuthErrorHelper(userid?: string) {
  const {
    data: { user },
    error,
  } = await (await getServerSupabase()).auth.getUser();
  if (isAuthSessionMissingError(error)) {
    return {
      user: null,
      error: json({ error: "UNAUTHORIZED", message: "로그인이 필요합니다." }, 401),
    };
  }
  if (error) throw error;

  if (!user) {
    return {
      user: null,
      error: json({ error: "UNAUTHORIZED", message: "로그인이 필요합니다." }, 401),
    };
  }

  if (userid && user.id !== userid) {
    return { user: null, error: json({ error: "FORBIDDEN" }, 403) };
  }

  return { user, error: null };
}

// 400 에러처리
export function badRequest(message = "잘못된 요청입니다.") {
  return json({ error: "BAD_REQUEST", message }, 400);
}
// 400(zod) 에러처리
export function validationError(details: unknown) {
  return json({ error: "VALIDATION_ERROR", message: "입력값 검증 실패", details }, 400);
}

// 404 에러처리
export function notFound(resource = "리소스") {
  return json({ error: "NOT_FOUND", message: `${resource}를 찾을 수 없습니다.` }, 404);
}
// 500 에러처리
export function internalError(message = "서버 오류가 발생했습니다.") {
  return json({ error: "INTERNAL_ERROR", message }, 500);
}

/**
 * API 라우트가 잡은 오류를 응답으로 바꾼다. 어떤 오류를 몇 번으로 답할지는 여기서만 정한다.
 * - 입력 검증 실패(ZodError): 400. 사용자 입력 문제라 로그를 남기지 않는다.
 * - Supabase 오류: respondWithSupabaseError(없는 페이지 404, DB에 닿지 못함 503, 권한 403, 그 밖 400)
 * - 그 밖(우리 코드의 버그 등): 500. 원인은 응답에 싣지 않고 로그에만 남긴다.
 * context는 로그에 붙일 설명이고, message는 500일 때 사용자에게 보일 문구다.
 */
export function respondWithError(error: unknown, context: string, message?: string): Response {
  if (error instanceof ZodError) return validationError(error.errors);
  if (isPostgrestError(error)) return respondWithSupabaseError(error, context);
  console.error(context, error);
  return internalError(message);
}
