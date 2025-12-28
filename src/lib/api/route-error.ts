import type { PostgrestError } from "@supabase/supabase-js";
import { getServerSupabase } from "../supabase/server";

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

// PostgrestError
export const isPostgrestError = (error: unknown): error is PostgrestError =>
  typeof (error as PostgrestError)?.code === "string";

export const respondWithSupabaseError = (error: PostgrestError) => {
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

export const serializeUnknownError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause ?? null,
    };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  if (typeof error === "object" && error !== null) {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return { message: error.toString() };
    }
  }
  return { message: String(error) };
};

// 인증 에러 매핑 헬퍼
export async function AuthErrorHelper(id?: string) {
  const {
    data: { user },
    error,
  } = await getServerSupabase().auth.getUser();
  if (error) throw error;
  if (!user) return json({ error: "UNAUTHORIZED", status: 401 });
  if (id && user.id !== id) return json({ error: "FORBIDDEN", status: 403 });
  return null;
}

// 400 Bad Request 에러처리
export const badRequest = (message = "잘못된 요청입니다.") =>
  json({ error: "BAD_REQUEST", message }, 400);

// 400 Validation Error(zod) 에러처리
export const validationError = (details: unknown) =>
  json({ error: "VALIDATION_ERROR", message: "입력값 검증 실패", details }, 400);

// 404 Not Found  에러처리
export const notFound = (resource = "리소스") =>
  json({ error: "NOT_FOUND", message: `${resource}를 찾을 수 없습니다.` }, 404);

// 500 Internal 에러처리
export const internalError = (message = "서버 오류가 발생했습니다.") =>
  json({ error: "INTERNAL_ERROR", message }, 500);
