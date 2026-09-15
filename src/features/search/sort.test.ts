import { describe, expect, test } from "vitest";

import { isSearchSort, parseSearchSort, toContentSorts } from "./sort";

describe("통합검색 정렬", () => {
  test.each([
    ["recent", { recipe: "recent", combo: "recent", post: "recent" }],
    ["like", { recipe: "like", combo: "like", post: "likes" }],
    ["view", { recipe: "view", combo: "view", post: "views" }],
  ] as const)("%s 정렬을 콘텐츠별 키로 변환한다", (sort, expected) => {
    expect(isSearchSort(sort)).toBe(true);
    expect(parseSearchSort(sort)).toBe(sort);
    expect(toContentSorts(sort)).toEqual(expected);
  });

  test.each([undefined, null, "", "popular"])("지원하지 않는 %s은 최신순으로 처리한다", (value) => {
    expect(isSearchSort(value)).toBe(false);
    expect(parseSearchSort(value)).toBe("recent");
  });
});
