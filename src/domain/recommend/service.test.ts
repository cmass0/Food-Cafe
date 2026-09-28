import { describe, expect, test } from "vitest";

import type { RecommendationCardRows, RecommendationRef, RecommendRecipeRow } from "./types";
import { mapRecommendationCards, mapRecommendRecipeRow } from "./service";

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

const recipe = (id: string): RecommendationRef => ({ sourceType: "recipe", sourceId: id });
const combo = (id: string): RecommendationRef => ({ sourceType: "combo", sourceId: id });
const cardRow = (prefix: string, id: string) => ({ id, title: `${prefix} ${id}`, summary: null });
const rows = ({
  recipes = [],
  combos = [],
}: {
  recipes?: string[];
  combos?: string[];
}): RecommendationCardRows => ({
  recipes: recipes.map((id) => cardRow("레시피", id)),
  combos: combos.map((id) => cardRow("조합", id)),
});

describe("추천 카드 조립", () => {
  test("원본 조회 순서와 무관하게 레시피와 조합이 섞인 순위를 유지한다", () => {
    const cards = mapRecommendationCards(
      [combo("c1"), recipe("r1"), combo("c2")],
      rows({ recipes: ["r1"], combos: ["c2", "c1"] })
    );

    expect(cards).toEqual([
      { sourceType: "combo", id: "c1", title: "조합 c1", summary: null },
      { sourceType: "recipe", id: "r1", title: "레시피 r1", summary: null },
      { sourceType: "combo", id: "c2", title: "조합 c2", summary: null },
    ]);
  });

  test("같은 ID라도 순위의 종류와 다른 테이블의 행은 쓰지 않는다", () => {
    expect(mapRecommendationCards([combo("same")], rows({ recipes: ["same"] }))).toEqual([]);
    expect(mapRecommendationCards([recipe("same")], rows({ combos: ["same"] }))).toEqual([]);
  });

  test("원본에서 읽을 수 없는 콘텐츠는 카드에서 제외한다", () => {
    expect(
      mapRecommendationCards(
        [recipe("hidden"), combo("hidden"), combo("visible")],
        rows({ combos: ["visible"] })
      )
    ).toEqual([{ sourceType: "combo", id: "visible", title: "조합 visible", summary: null }]);
  });

  test("제외된 항목을 건너뛰고 읽을 수 있는 상위 다섯 개만 반환한다", () => {
    const refs = [recipe("hidden"), ...["1", "2", "3", "4", "5", "6"].map(combo)];

    expect(
      mapRecommendationCards(refs, rows({ combos: ["1", "2", "3", "4", "5", "6"] })).map(
        (item) => item.id
      )
    ).toEqual(["1", "2", "3", "4", "5"]);
  });

  test("추천 기록이 없으면 빈 카드를 반환한다", () => {
    expect(mapRecommendationCards([], rows({}))).toEqual([]);
  });
});
