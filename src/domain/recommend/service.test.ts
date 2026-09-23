import { describe, expect, test } from "vitest";

import type { RecommendRecipeRow } from "./types";
import { mapRecommendRecipeRow } from "./service";

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
