import { describe, expect, test } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";

import { respondWithSupabaseError } from "./route-error";

function postgrestError(code: string): PostgrestError {
  return {
    name: "PostgrestError",
    code,
    message: `${code} message`,
    details: `${code} details`,
    hint: "",
  } as PostgrestError;
}

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

  test.each([["22P02"], ["23505"], ["PGRST116"]] as const)(
    "그 밖의 DB 오류 %s는 400으로 응답한다",
    (code) => {
      expect(respondWithSupabaseError(postgrestError(code)).status).toBe(400);
    }
  );
});
