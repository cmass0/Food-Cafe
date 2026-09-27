import { describe, expect, test, vi } from "vitest";
import { notFound, redirect } from "next/navigation";

import { loadSection } from "./section";

describe("loadSection", () => {
  test.each([
    ["404", () => notFound(), "NEXT_HTTP_ERROR_FALLBACK;404"],
    ["리다이렉트", () => redirect("/login"), "NEXT_REDIRECT"],
  ] as const)(
    "%s 제어 예외는 실패 데이터로 바꾸지 않고 전달한다",
    async (_label, navigate, message) => {
      await expect(loadSection("navigation", async () => navigate(), null)).rejects.toThrow(
        message
      );
    }
  );

  test("조회에 성공하면 원래 데이터와 성공 상태를 반환한다", async () => {
    const data = { items: ["레시피"], total: 1 };

    await expect(
      loadSection("recipes", async () => data, { items: [], total: 0 })
    ).resolves.toEqual({
      data,
      error: false,
      outOfRange: false,
    });
  });

  test("조회에 실패하면 대체값과 실패 상태를 반환한다", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fallback = { items: [], total: 0 };

    try {
      await expect(
        loadSection(
          "recipes",
          async () => {
            throw new Error("연결 실패");
          },
          fallback
        )
      ).resolves.toEqual({ data: fallback, error: true, outOfRange: false });
      expect(consoleError).toHaveBeenCalledOnce();
    } finally {
      consoleError.mockRestore();
    }
  });

  test("대체값이 null이어도 실패 상태와 구분해 반환한다", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      await expect(
        loadSection<number | null>(
          "summary",
          async () => {
            throw new Error("집계 실패");
          },
          null
        )
      ).resolves.toEqual({ data: null, error: true, outOfRange: false });
    } finally {
      consoleError.mockRestore();
    }
  });

  test("범위를 벗어난 페이지는 장애가 아니라 범위 밖 상태로 반환하고 오류 로그를 남기지 않는다", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fallback = { items: [], total: 0 };

    try {
      await expect(
        loadSection(
          "recipes",
          async () => {
            throw { code: "PGRST103", message: "Requested range not satisfiable" };
          },
          fallback
        )
      ).resolves.toEqual({ data: fallback, error: false, outOfRange: true });
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  test("범위 오류가 아닌 DB 오류는 조회 실패로 반환한다", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fallback = { items: [], total: 0 };

    try {
      await expect(
        loadSection(
          "recipes",
          async () => {
            throw { code: "22P02", message: "invalid input syntax" };
          },
          fallback
        )
      ).resolves.toEqual({ data: fallback, error: true, outOfRange: false });
    } finally {
      consoleError.mockRestore();
    }
  });
});
