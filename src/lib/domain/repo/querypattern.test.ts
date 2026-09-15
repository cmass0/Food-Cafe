import { describe, expect, test } from "vitest";

import { escapeArrayValue, normalizeSearchTerm } from "./querypattern";

describe("배열 검색값 이스케이프", () => {
  test.each([
    ["한식", '"한식"'],
    ['그가 "맛있다"고 함', '"그가 \\"맛있다\\"고 함"'],
    ["C:\\recipe", '"C:\\\\recipe"'],
  ] as const)("%s을 배열 검색 문자열 %s로 변환한다", (input, expected) => {
    expect(escapeArrayValue(input)).toBe(expected);
  });
});

describe("검색어 정규화", () => {
  test.each([
    [" 김치 pasta 123 ", "김치 pasta 123"],
    ["김치%_볶음;DROP", "김치볶음DROP"],
    ["@#$", ""],
  ] as const)("%s에서 허용되지 않은 문자를 제거해 %s을 반환한다", (input, expected) => {
    expect(normalizeSearchTerm(input)).toBe(expected);
  });
});
