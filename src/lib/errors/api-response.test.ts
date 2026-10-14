import { afterEach, describe, expect, test, vi } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";

import {
  respondWithError,
  respondWithServerQueryError,
  respondWithSupabaseError,
} from "./api-response";

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
    silenceErrorLog();
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
      silenceErrorLog();
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

describe("respondWithError", () => {
  const CONTEXT = "레시피 조회 실패";

  function zodError() {
    const result = z.object({ title: z.string() }).safeParse({});
    if (result.success) throw new Error("검증이 실패해야 하는 입력이다");
    return result.error;
  }

  test("입력 검증 실패는 400 VALIDATION_ERROR와 어긋난 항목 목록으로 응답한다", async () => {
    const res = respondWithError(zodError(), CONTEXT);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({ error: "VALIDATION_ERROR", message: "입력값 검증 실패" });
    expect(body.details[0].path).toEqual(["title"]);
  });

  test("입력 검증 실패는 사용자 입력 문제라 서버 로그를 남기지 않는다", () => {
    const log = silenceErrorLog();
    respondWithError(zodError(), CONTEXT);

    expect(log).not.toHaveBeenCalled();
  });

  test("DB에 닿지 못한 Supabase 오류는 503으로 응답한다", async () => {
    silenceErrorLog();
    const res = respondWithError(GATEWAY_FAILURE, CONTEXT);

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual(UNAVAILABLE_BODY);
  });

  test("503으로 답한 오류는 API 설명을 붙여 로그에 한 번만 남긴다", () => {
    const log = silenceErrorLog();
    respondWithError(NETWORK_FAILURE, CONTEXT);

    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(CONTEXT, NETWORK_FAILURE);
  });

  test("Supabase 권한 거부는 403으로 응답한다", () => {
    silenceErrorLog();
    expect(respondWithError(postgrestError("42501"), CONTEXT).status).toBe(403);
  });

  test("범위를 벗어난 페이지는 404로 응답하고 로그를 남기지 않는다", () => {
    const log = silenceErrorLog();
    const res = respondWithError(postgrestError("PGRST103"), CONTEXT);

    expect(res.status).toBe(404);
    expect(log).not.toHaveBeenCalled();
  });

  test.each([
    ["Error", new Error("Cannot read properties of undefined")],
    ["TypeError", new TypeError("x is not a function")],
    ["문자열", "fetch failed"],
    ["null", null],
    ["undefined", undefined],
  ] as const)("코드가 던진 %s는 내부 내용 없이 500으로 응답한다", async (_label, error) => {
    silenceErrorLog();
    const res = respondWithError(error, CONTEXT);

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다.",
    });
  });

  test("500 문구를 넘기면 그 문구로 응답한다", async () => {
    silenceErrorLog();
    const res = respondWithError(new Error("boom"), CONTEXT, "인기 추천을 불러오지 못했습니다.");

    await expect(res.json()).resolves.toEqual({
      error: "INTERNAL_ERROR",
      message: "인기 추천을 불러오지 못했습니다.",
    });
  });

  test("500으로 숨긴 원래 오류는 API 설명을 붙여 로그에 남긴다", () => {
    const log = silenceErrorLog();
    const error = new Error("boom");
    respondWithError(error, CONTEXT);

    expect(log).toHaveBeenCalledWith(CONTEXT, error);
  });
});

describe("respondWithServerQueryError", () => {
  const CONTEXT = "인기 추천 조회 실패";
  const MESSAGE = "인기 추천을 불러오지 못했습니다.";

  test.each([["42883"], ["P0001"], ["22P02"], ["42501"], ["PGRST116"]] as const)(
    "서버 권한 조회의 DB 오류 %s는 내용을 숨기고 500으로 응답한다",
    async (code) => {
      silenceErrorLog();
      const res = respondWithServerQueryError(postgrestError(code), CONTEXT, MESSAGE);

      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({ error: "INTERNAL_ERROR", message: MESSAGE });
    }
  );

  test("숨긴 DB 오류는 API 설명을 붙여 로그에 남긴다", () => {
    const log = silenceErrorLog();
    const error = postgrestError("42883");
    respondWithServerQueryError(error, CONTEXT, MESSAGE);

    expect(log).toHaveBeenCalledWith(CONTEXT, error);
  });

  test("DB에 닿지 못한 오류는 503으로 응답한다", async () => {
    silenceErrorLog();
    const res = respondWithServerQueryError(GATEWAY_FAILURE, CONTEXT, MESSAGE);

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual(UNAVAILABLE_BODY);
  });

  test("입력 검증 실패는 400으로 응답한다", () => {
    const result = z.object({ items: z.array(z.string()) }).safeParse({});
    if (result.success) throw new Error("검증이 실패해야 하는 입력이다");

    expect(respondWithServerQueryError(result.error, CONTEXT, MESSAGE).status).toBe(400);
  });

  test("코드가 던진 오류는 넘긴 문구의 500으로 응답한다", async () => {
    silenceErrorLog();
    const res = respondWithServerQueryError(new Error("boom"), CONTEXT, MESSAGE);

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "INTERNAL_ERROR", message: MESSAGE });
  });
});
