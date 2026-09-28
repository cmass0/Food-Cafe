import { describe, expect, test } from "vitest";

import {
  MAX_RECOMMEND_INGREDIENTS,
  MAX_RECOMMEND_QUERY_LENGTH,
  MAX_RECOMMEND_RESULTS,
  personalRecommendationRequestSchema,
  recommendRecipeSearchSchema,
} from "./schema";
import { VIEW_HISTORY_LIMIT } from "./view-history";

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

const VIEWED_RECIPE = {
  sourceType: "recipe",
  sourceId: "00000000-0000-4000-8000-000000000001",
  viewedAt: 100,
  viewCount: 2,
} as const;

function viewedCombos(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    sourceType: "combo",
    sourceId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    viewedAt: index,
    viewCount: 1,
  }));
}

describe("맞춤 추천 요청", () => {
  test("조회 기록을 그대로 받는다", () => {
    expect(personalRecommendationRequestSchema.parse({ items: [VIEWED_RECIPE] })).toEqual({
      items: [VIEWED_RECIPE],
    });
  });

  test("본 횟수가 없는 이전 형식의 기록은 한 번 본 것으로 채운다", () => {
    const legacy = {
      sourceType: VIEWED_RECIPE.sourceType,
      sourceId: VIEWED_RECIPE.sourceId,
      viewedAt: VIEWED_RECIPE.viewedAt,
    };

    expect(personalRecommendationRequestSchema.parse({ items: [legacy] })).toEqual({
      items: [{ ...legacy, viewCount: 1 }],
    });
  });

  test("빈 조회 기록을 받는다", () => {
    expect(personalRecommendationRequestSchema.parse({ items: [] })).toEqual({ items: [] });
  });

  test("사용자 ID처럼 서버가 정해야 하는 값은 본문에서 버린다", () => {
    expect(
      personalRecommendationRequestSchema.parse({
        items: [VIEWED_RECIPE],
        userId: "00000000-0000-4000-8000-000000000099",
        embeddingModelId: "other-model",
        matchCount: 20,
      })
    ).toEqual({ items: [VIEWED_RECIPE] });
  });

  test(`조회 기록은 ${VIEW_HISTORY_LIMIT}개까지 받는다`, () => {
    expect(
      personalRecommendationRequestSchema.parse({ items: viewedCombos(VIEW_HISTORY_LIMIT) }).items
    ).toHaveLength(VIEW_HISTORY_LIMIT);
  });

  test(`조회 기록이 ${VIEW_HISTORY_LIMIT + 1}개면 거부한다`, () => {
    const result = personalRecommendationRequestSchema.safeParse({
      items: viewedCombos(VIEW_HISTORY_LIMIT + 1),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["items"]);
  });

  test.each([
    ["본문 없음", null, []],
    ["조회 기록 누락", {}, ["items"]],
    ["배열이 아닌 조회 기록", { items: VIEWED_RECIPE }, ["items"]],
    [
      "지원하지 않는 종류",
      { items: [{ ...VIEWED_RECIPE, sourceType: "post" }] },
      ["items", 0, "sourceType"],
    ],
    [
      "UUID가 아닌 ID",
      { items: [{ ...VIEWED_RECIPE, sourceId: "recipe-a" }] },
      ["items", 0, "sourceId"],
    ],
    ["빈 ID", { items: [{ ...VIEWED_RECIPE, sourceId: "" }] }, ["items", 0, "sourceId"]],
    [
      "조회 시각 누락",
      { items: [{ ...VIEWED_RECIPE, viewedAt: undefined }] },
      ["items", 0, "viewedAt"],
    ],
    [
      "무한대 조회 시각",
      { items: [{ ...VIEWED_RECIPE, viewedAt: Infinity }] },
      ["items", 0, "viewedAt"],
    ],
    ["본 횟수 0", { items: [{ ...VIEWED_RECIPE, viewCount: 0 }] }, ["items", 0, "viewCount"]],
    ["음수 본 횟수", { items: [{ ...VIEWED_RECIPE, viewCount: -1 }] }, ["items", 0, "viewCount"]],
    ["소수 본 횟수", { items: [{ ...VIEWED_RECIPE, viewCount: 1.5 }] }, ["items", 0, "viewCount"]],
    [
      "문자열 본 횟수",
      { items: [{ ...VIEWED_RECIPE, viewCount: "2" }] },
      ["items", 0, "viewCount"],
    ],
    [
      "NaN 본 횟수",
      { items: [{ ...VIEWED_RECIPE, viewCount: Number.NaN }] },
      ["items", 0, "viewCount"],
    ],
  ] as const)("%s은 거부한다", (_label, input, expectedPath) => {
    const result = personalRecommendationRequestSchema.safeParse(input);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(expectedPath);
  });
});
