import { describe, expect, test } from "vitest";
import { createClient, PostgrestError } from "@supabase/supabase-js";
import { ZodError } from "zod";

import { isPageOutOfRangeError, isPostgrestError } from "./supabase";

describe("isPageOutOfRangeError", () => {
  test("PGRST103만 데이터가 없는 페이지로 판정한다", () => {
    expect(isPageOutOfRangeError({ code: "PGRST103" })).toBe(true);
    expect(isPageOutOfRangeError({ code: "22P02" })).toBe(false);
    expect(isPageOutOfRangeError({ code: 103 })).toBe(false);
  });

  test.each([null, undefined, "PGRST103", new Error("조회 실패")])(
    "%s에는 범위 오류 코드가 없다고 판정한다",
    (error) => {
      expect(isPageOutOfRangeError(error)).toBe(false);
    }
  );
});

describe("isPostgrestError", () => {
  test.each([
    [
      "DB 연결 대기 시간 초과",
      { code: "PGRST003", message: "Timed out", details: null, hint: null },
    ],
    [
      "쿼리 시간 초과",
      { code: "57014", message: "canceling statement", details: null, hint: null },
    ],
    ["중복", { code: "23505", message: "duplicate key", details: "", hint: "" }],
    [
      "연결 실패(code가 빈 문자열)",
      { code: "", message: "TypeError: fetch failed", details: "", hint: "" },
    ],
  ] as const)("REST 서버가 돌려준 %s 오류를 Supabase 오류로 본다", (_label, error) => {
    expect(isPostgrestError(error)).toBe(true);
  });

  test.each([
    ["JSON 본문", { message: "An unexpected error occurred" }],
    ["JSON이 아닌 본문", { message: "<html><body>502 Bad Gateway</body></html>" }],
  ] as const)("게이트웨이가 코드 없이 돌려준 %s 오류도 Supabase 오류로 본다", (_label, error) => {
    expect(isPostgrestError(error)).toBe(true);
  });

  test("Supabase가 던진 PostgrestError는 Error여도 Supabase 오류로 본다", () => {
    const thrown = new PostgrestError({
      code: "PGRST003",
      message: "Timed out",
      details: "",
      hint: "",
    });

    expect(isPostgrestError(thrown)).toBe(true);
  });

  test.each([
    ["Error", new Error("undefined를 읽을 수 없음")],
    ["TypeError", new TypeError("x is not a function")],
    ["ZodError", new ZodError([])],
  ] as const)(
    "코드가 던진 %s는 Supabase 오류로 보지 않는다(버그를 503으로 숨기지 않음)",
    (_label, error) => {
      expect(isPostgrestError(error)).toBe(false);
    }
  );

  test.each([
    ["null", null],
    ["undefined", undefined],
    ["문자열", "fetch failed"],
    ["숫자", 500],
    ["빈 객체", {}],
    ["message가 문자열이 아닌 객체", { message: 500 }],
  ] as const)("%s는 Supabase 오류로 보지 않는다", (_label, error) => {
    expect(isPostgrestError(error)).toBe(false);
  });

  // 실제 supabase-js가 게이트웨이 응답을 어떤 모양의 오류로 돌려주는지 고정한다.
  // 부하 중 DB가 멈췄을 때 로컬 게이트웨이(Kong)가 코드 없는 500을 돌려줬고, 이를 놓친 API가 503 대신 500으로 답했다.
  test.each([
    [
      "JSON 본문 500",
      () => Response.json({ message: "An unexpected error occurred" }, { status: 500 }),
    ],
    ["HTML 본문 502", () => new Response("<html>502 Bad Gateway</html>", { status: 502 })],
  ] as const)(
    "supabase-js가 게이트웨이의 %s 응답으로 돌려준 오류를 Supabase 오류로 본다",
    async (_label, respond) => {
      const client = createClient("https://project.supabase.co", "test-anon-key", {
        global: { fetch: async () => respond() },
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { error } = await client.from("recipes").select("id");

      expect(error?.code).toBeUndefined();
      expect(isPostgrestError(error)).toBe(true);
    }
  );
});
