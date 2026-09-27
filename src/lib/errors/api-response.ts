import type { PostgrestError } from "@supabase/supabase-js";
import { isAuthSessionMissingError, isPageOutOfRangeError } from "@/lib/errors/supabase";
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

export const respondWithSupabaseError = (error: PostgrestError) => {
  // 목록 범위를 벗어난 page는 잘못된 요청이 아니라 "없는 페이지"다.
  // 레시피·조합 목록 화면은 이 404를 보고 첫 페이지 안내를 띄운다.
  if (isPageOutOfRangeError(error)) {
    return json(
      { error: "PAGE_OUT_OF_RANGE", message: "요청한 페이지에 표시할 항목이 없습니다." },
      404
    );
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
