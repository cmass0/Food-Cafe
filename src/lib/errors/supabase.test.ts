import { describe, expect, test } from "vitest";

import { isPageOutOfRangeError } from "./supabase";

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
