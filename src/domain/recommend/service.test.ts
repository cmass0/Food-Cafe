import { describe, expect, test } from "vitest";

import type { PopularRecipeCardRow, RecommendRecipeRow } from "./types";
import { mapPopularRecipeCards, mapRecommendRecipeRow } from "./service";

const RECIPE_ROW: RecommendRecipeRow = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "간장 계란밥",
  summary: "간단한 한 끼",
  category: "rice",
  tags: ["간단", "집밥"],
  tools: ["프라이팬"],
  tools_required: true,
  difficulty: "매우 쉬움",
  time_minutes: 10,
  servings: 1,
  ingredients: [
    { name: " 계란 ", amount: " 1 ", unit: " 개 ", unitCustom: "" },
    { name: " ", amount: " ", unit: " ", unitCustom: "" },
  ],
  like_count: 12,
  bookmark_count: 8,
  comment_count: 3,
  view_count: 120,
  created_at: "2026-09-20T00:00:00.000Z",
};

describe("추천 레시피 공개 후보 변환", () => {
  test("추천 답변에 필요한 공개 필드를 만든다", () => {
    expect(mapRecommendRecipeRow(RECIPE_ROW)).toEqual({
      id: RECIPE_ROW.id,
      title: "간장 계란밥",
      summary: "간단한 한 끼",
      category: "rice",
      tags: ["간단", "집밥"],
      tools: ["프라이팬"],
      toolsRequired: true,
      difficulty: "매우 쉬움",
      timeMinutes: 10,
      servings: 1,
      ingredients: [{ name: "계란", amount: "1", unit: "개", unitCustom: "" }],
      ingredientCount: 1,
      likeCount: 12,
      bookmarkCount: 8,
      commentCount: 3,
      viewCount: 120,
    });
  });

  test("원본 행에 추가 필드가 있어도 공개 후보에 포함하지 않는다", () => {
    const rowWithPrivateFields = {
      ...RECIPE_ROW,
      writer_name: "작성자 이름",
      writer_uid: "00000000-0000-4000-8000-000000000099",
    } as RecommendRecipeRow;

    expect(mapRecommendRecipeRow(rowWithPrivateFields)).not.toHaveProperty("writer_name");
    expect(mapRecommendRecipeRow(rowWithPrivateFields)).not.toHaveProperty("writer_uid");
  });
});

const row = (id: string): PopularRecipeCardRow => ({
  id,
  title: `레시피 ${id}`,
  summary: null,
});

describe("인기 추천 카드 조립", () => {
  test("원본 조회 순서와 무관하게 집계 순위를 유지한다", () => {
    const cards = mapPopularRecipeCards(["a", "b"], [row("b"), row("a")]);

    expect(cards).toEqual([
      { sourceType: "recipe", id: "a", title: "레시피 a", summary: null },
      { sourceType: "recipe", id: "b", title: "레시피 b", summary: null },
    ]);
  });

  test("원본에서 읽을 수 없는 레시피는 카드에서 제외한다", () => {
    expect(mapPopularRecipeCards(["hidden", "visible"], [row("visible")])).toEqual([
      {
        sourceType: "recipe",
        id: "visible",
        title: "레시피 visible",
        summary: null,
      },
    ]);
  });

  test("공개 레시피가 여섯 개 이상이면 상위 다섯 개만 반환한다", () => {
    const rankedIds = Array.from({ length: 6 }, (_, index) => String(index + 1));
    const rows = rankedIds.map(row);

    expect(mapPopularRecipeCards(rankedIds, rows).map((item) => item.id)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
  });

  test("추천 기록이 없으면 빈 카드를 반환한다", () => {
    expect(mapPopularRecipeCards([], [])).toEqual([]);
  });
});
