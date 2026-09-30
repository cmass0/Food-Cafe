import { describe, expect, test } from "vitest";

import {
  parseRecipeListLimit,
  parseRecipeListPage,
  parseRecipeSearchField,
  parseRecipeSort,
} from "./list-params";

const INVALID_NUMBERS = [
  ["undefined", undefined],
  ["null", null],
  ["빈 문자열", ""],
  ["공백 문자열", "   "],
  ["숫자가 아닌 값", "abc"],
  ["0", "0"],
  ["음수", "-3"],
  ["소수", "2.5"],
  ["무한대", "Infinity"],
] as const;

describe("parseRecipeListPage", () => {
  test.each(INVALID_NUMBERS)("%s이면 지정 안 함으로 본다", (_label, value) => {
    expect(parseRecipeListPage(value)).toBeUndefined();
  });

  test.each([
    ["1", 1],
    ["3", 3],
    [" 7 ", 7],
  ] as const)("1 이상의 정수 문자열 %j는 %i로 받는다", (value, expected) => {
    expect(parseRecipeListPage(value)).toBe(expected);
  });
});

describe("parseRecipeListLimit", () => {
  test.each(INVALID_NUMBERS)("%s이면 지정 안 함으로 본다", (_label, value) => {
    expect(parseRecipeListLimit(value)).toBeUndefined();
  });

  test.each([
    ["1", 1],
    ["12", 12],
    ["50", 50],
  ] as const)("상한 이하인 %j는 %i로 받는다", (value, expected) => {
    expect(parseRecipeListLimit(value)).toBe(expected);
  });

  test.each(["51", "1000"])("상한을 넘는 %j는 상한 50으로 줄인다", (value) => {
    expect(parseRecipeListLimit(value)).toBe(50);
  });
});

describe("parseRecipeSort", () => {
  test.each(["recent", "like", "view"] as const)("정렬 %s는 그대로 받는다", (value) => {
    expect(parseRecipeSort(value)).toBe(value);
  });

  test.each([undefined, null, "", "popular", "LIKE"])(
    "정렬 값이 아닌 %j는 지정 안 함으로 본다",
    (value) => {
      expect(parseRecipeSort(value)).toBeUndefined();
    }
  );
});

describe("parseRecipeSearchField", () => {
  test.each(["tag", "title", "tag_title", "writer"] as const)(
    "검색 대상 %s는 그대로 받는다",
    (value) => {
      expect(parseRecipeSearchField(value)).toBe(value);
    }
  );

  test.each([undefined, null, "", "content", "TITLE"])(
    "검색 대상이 아닌 %j는 지정 안 함으로 본다",
    (value) => {
      expect(parseRecipeSearchField(value)).toBeUndefined();
    }
  );
});
