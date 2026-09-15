import { describe, expect, test } from "vitest";

import { buildAuthModalPath, normalizeReturnTo } from "./return-to";

describe("normalizeReturnTo", () => {
  test("내부 경로의 쿼리와 해시를 유지한다", () => {
    expect(normalizeReturnTo("/recipes?page=2#comments")).toBe("/recipes?page=2#comments");
  });

  test.each(["https://example.com/phishing", "//example.com/phishing", "javascript:alert(1)"])(
    "외부 주소 %s를 홈 경로로 바꾼다",
    (next) => {
      expect(normalizeReturnTo(next)).toBe("/");
    }
  );

  test("값이 없으면 전달한 기본 경로를 사용한다", () => {
    expect(normalizeReturnTo(undefined, "/posts")).toBe("/posts");
  });
});

describe("buildAuthModalPath", () => {
  test("로그인 모달과 안전한 복귀 경로를 쿼리에 담는다", () => {
    const result = new URL(buildAuthModalPath("/recipes/new"), "https://foodcafe.local");

    expect(result.pathname).toBe("/");
    expect(result.searchParams.get("auth")).toBe("login");
    expect(result.searchParams.get("next")).toBe("/recipes/new");
  });
});
