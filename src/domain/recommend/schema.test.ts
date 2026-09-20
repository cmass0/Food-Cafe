import { describe, expect, test } from "vitest";

import {
  MAX_RECOMMEND_INGREDIENTS,
  MAX_RECOMMEND_QUERY_LENGTH,
  MAX_RECOMMEND_RESULTS,
  recommendRecipeSearchSchema,
} from "./schema";

describe("추천 레시피 검색 입력", () => {
  test("값이 없으면 인기순과 기본 검색 개수를 사용한다", () => {
    expect(recommendRecipeSearchSchema.parse({})).toEqual({
      query: "",
      ingredients: [],
      sort: "popular",
      limit: 5,
    });
  });

  test("검색어와 재료의 공백을 제거하고 중복 재료를 합친다", () => {
    expect(
      recommendRecipeSearchSchema.parse({
        query: "  간단한 계란 요리  ",
        ingredients: [" 계란 ", "계란", " 밥 "],
      })
    ).toMatchObject({
      query: "간단한 계란 요리",
      ingredients: ["계란", "밥"],
    });
  });

  test.each([
    ["검색어", { query: "가".repeat(MAX_RECOMMEND_QUERY_LENGTH + 1) }, ["query"]],
    [
      "재료 개수",
      {
        ingredients: Array.from(
          { length: MAX_RECOMMEND_INGREDIENTS + 1 },
          (_, index) => `재료${index}`
        ),
      },
      ["ingredients"],
    ],
    ["결과 개수", { limit: MAX_RECOMMEND_RESULTS + 1 }, ["limit"]],
    ["0분 조리 시간", { maxTimeMinutes: 0 }, ["maxTimeMinutes"]],
    ["소수 조리 시간", { maxTimeMinutes: 1.5 }, ["maxTimeMinutes"]],
  ] as const)("%s 상한이나 형식을 벗어나면 거부한다", (_label, input, expectedPath) => {
    const result = recommendRecipeSearchSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(expectedPath);
    }
  });
});
