import { afterEach, describe, expect, test, vi } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";

import { respondWithSupabaseError } from "./api-response";

function postgrestError(code: string): PostgrestError {
  return {
    name: "PostgrestError",
    code,
    message: `${code} message`,
    details: `${code} details`,
    hint: "",
  } as PostgrestError;
}

// supabase-js가 DB 서버에 연결하지 못했을 때 돌려주는 모양(코드 없음, details에 서버 내부 스택).
const NETWORK_FAILURE = {
  message: "TypeError: fetch failed",
  details:
    "TypeError: fetch failed\n\nCaused by: SocketError: other side closed\n    at C:\\app\\x.js",
  hint: "",
  code: "",
} as PostgrestError;

// 앞단 게이트웨이가 DB 서버 대신 답했을 때의 모양(code 필드 자체가 없음).
const GATEWAY_FAILURE = {
  message: "An invalid response was received from the upstream server",
} as PostgrestError;

const UNAVAILABLE_BODY = {
  error: "SERVICE_UNAVAILABLE",
  message: "잠시 후 다시 시도해 주세요.",
};

function silenceErrorLog() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("respondWithSupabaseError", () => {
  test("범위를 벗어난 페이지는 404 PAGE_OUT_OF_RANGE로 응답한다", async () => {
    const res = respondWithSupabaseError(postgrestError("PGRST103"));

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error: "PAGE_OUT_OF_RANGE",
      message: "요청한 페이지에 표시할 항목이 없습니다.",
    });
  });

  test("권한 거부는 403으로 응답한다", async () => {
    const res = respondWithSupabaseError(postgrestError("42501"));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "42501",
      message: "42501 message",
      details: "42501 details",
    });
  });

  test.each([["22P02"], ["23505"], ["PGRST116"], ["PGRST100"]] as const)(
    "그 밖의 DB 오류 %s는 400으로 응답한다",
    (code) => {
      expect(respondWithSupabaseError(postgrestError(code)).status).toBe(400);
    }
  );

  test.each([
    ["DB 서버 연결 실패", NETWORK_FAILURE],
    ["게이트웨이 응답", GATEWAY_FAILURE],
  ] as const)("%s는 내부 정보 없이 503으로 응답한다", async (_label, error) => {
    silenceErrorLog();
    const res = respondWithSupabaseError(error);

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual(UNAVAILABLE_BODY);
  });

  test.each([
    { code: "PGRST000", meaning: "DB 연결 불가" },
    { code: "PGRST003", meaning: "연결 대기 시간 초과" },
    { code: "08006", meaning: "연결 끊김" },
    { code: "53300", meaning: "연결 수 초과" },
    { code: "57014", meaning: "쿼리 시간 초과" },
    { code: "57P03", meaning: "DB 시작 중" },
  ] as const)("DB 과부하·장애 코드 $code($meaning)는 503으로 응답한다", async ({ code }) => {
    silenceErrorLog();
    const res = respondWithSupabaseError(postgrestError(code));

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual(UNAVAILABLE_BODY);
  });

  test("503으로 숨긴 원래 오류는 서버 로그에 남긴다", () => {
    const log = silenceErrorLog();
    respondWithSupabaseError(NETWORK_FAILURE);

    expect(log).toHaveBeenCalledWith(expect.any(String), NETWORK_FAILURE);
  });
});
