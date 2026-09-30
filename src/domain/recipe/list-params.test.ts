import { describe, expect, test } from "vitest";

import {
  DEFAULT_RECIPE_LIST_LIMIT,
  parseRecipeListLimit,
  parseRecipeListPage,
  parseRecipeSearchField,
  parseRecipeSort,
  toRecipeListQuery,
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

describe("toRecipeListQuery", () => {
  const DEFAULTS = {
    sort: "recent",
    searchField: "title",
    limit: DEFAULT_RECIPE_LIST_LIMIT,
  } as const;

  test("기본값만 있으면 주소에 남길 조건이 없다", () => {
    expect(toRecipeListQuery(DEFAULTS)).toEqual({});
  });

  test("최신순이 아닌 정렬과 카테고리를 남긴다", () => {
    expect(toRecipeListQuery({ ...DEFAULTS, sort: "like", category: "korean" })).toEqual({
      sort: "like",
      category: "korean",
    });
  });

  test("검색어가 있으면 앞뒤 공백을 자른 검색어와 검색 대상을 함께 남긴다", () => {
    expect(toRecipeListQuery({ ...DEFAULTS, search: "  김치 ", searchField: "tag" })).toEqual({
      search: "김치",
      searchField: "tag",
    });
  });

  test("검색어가 공백뿐이면 검색 대상도 남기지 않는다", () => {
    expect(toRecipeListQuery({ ...DEFAULTS, search: "   ", searchField: "tag" })).toEqual({});
  });

  test("기본 크기가 아닌 limit은 남겨 다음 페이지도 같은 크기로 계산한다", () => {
    expect(toRecipeListQuery({ ...DEFAULTS, limit: 30 })).toEqual({ limit: "30" });
  });
});
