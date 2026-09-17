import { describe, expect, test, vi } from "vitest";

import { isEmptySearchPageError, loadSearchSection } from "./section-result";

const EMPTY_RESULT = {
  items: [],
  total: 0,
};

describe("isEmptySearchPageError", () => {
  test("PGRST103만 데이터가 없는 페이지로 판정한다", () => {
    expect(isEmptySearchPageError({ code: "PGRST103" })).toBe(true);
    expect(isEmptySearchPageError({ code: "22P02" })).toBe(false);
    expect(isEmptySearchPageError({ code: 103 })).toBe(false);
  });

  test.each([null, undefined, "PGRST103", new Error("조회 실패")])(
    "%s에는 범위 오류 코드가 없다고 판정한다",
    (error) => {
      expect(isEmptySearchPageError(error)).toBe(false);
    }
  );
});

describe("loadSearchSection", () => {
  test("조회에 성공하면 결과를 유지한다", async () => {
    const data = { items: ["레시피"], total: 1 };

    await expect(loadSearchSection("recipes", async () => data, EMPTY_RESULT)).resolves.toEqual({
      data,
      error: false,
    });
  });

  test("범위를 벗어난 페이지는 빈 결과로 바꾼다", async () => {
    await expect(
      loadSearchSection(
        "recipes",
        async () => {
          throw { code: "PGRST103" };
        },
        EMPTY_RESULT
      )
    ).resolves.toEqual({ data: EMPTY_RESULT, error: false });
  });

  test("실제 조회 오류는 빈 결과와 구분한다", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      await expect(
        loadSearchSection(
          "recipes",
          async () => {
            throw new Error("연결 실패");
          },
          EMPTY_RESULT
        )
      ).resolves.toEqual({ data: EMPTY_RESULT, error: true });
    } finally {
      consoleError.mockRestore();
    }
  });
});
