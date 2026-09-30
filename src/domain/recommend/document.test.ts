import { describe, expect, test } from "vitest";

import { buildComboRecommendationDocument, buildRecipeRecommendationDocument } from "./document";
import type {
  RecommendationComboDocumentSource,
  RecommendationRecipeDocumentSource,
} from "./types";

const RECIPE_SOURCE: RecommendationRecipeDocumentSource = {
  id: "recipe-1",
  title: "  김치볶음밥  ",
  summary: " 남은 재료로 만드는 한 끼 ",
  chef_tip: " 마지막에 참기름을 넣는다 ",
  steps: [{ description: " 김치를 볶는다 " }, { description: "밥을 넣는다" }],
  ingredients: [
    { name: " 김치 ", amount: "100", unit: "g", unitCustom: "" },
    { name: "밥", amount: "1", unit: "custom", unitCustom: "공기" },
  ],
  category: " 한식 ",
  tags: ["자취요리", " 자취요리 ", "간단"],
  tools: ["프라이팬", " 프라이팬 "],
  tools_required: true,
  difficulty: " 쉬움 ",
  time_minutes: 10,
  servings: 1,
};

const COMBO_SOURCE: RecommendationComboDocumentSource = {
  id: "combo-1",
  title: " 토스트 아침 세트 ",
  summary: " 가벼운 아침 식사 ",
  steps: [{ description: "접시에 함께 담는다" }],
  items: [
    { type: "recipe", recipeid: "recipe-1", title: "토스트", summary: "바삭한 토스트" },
    { type: "product", productName: " 그릭요거트 ", summary: "150g" },
  ],
  tags: ["아침", "간단"],
  tools: null,
  tools_required: false,
  difficulty: "하",
  time_minutes: 0,
};

describe("buildRecipeRecommendationDocument", () => {
  test("레시피 필드를 검색 문서와 정확 필터 값으로 변환한다", () => {
    const result = buildRecipeRecommendationDocument(RECIPE_SOURCE);

    expect(result).toEqual({
      sourceType: "recipe",
      sourceId: "recipe-1",
      title: "김치볶음밥",
      searchText: [
        "제목: 김치볶음밥",
        "설명: 남은 재료로 만드는 한 끼",
        "카테고리: 한식",
        "태그: 자취요리, 간단",
        "재료: 김치, 밥",
        "조리 도구: 프라이팬",
        "조리 순서: 김치를 볶는다 밥을 넣는다",
        "팁: 마지막에 참기름을 넣는다",
      ].join("\n"),
      category: "한식",
      difficulty: "쉬움",
      timeMinutes: 10,
      toolsRequired: true,
      ingredientNames: ["김치", "밥"],
    });
  });

  test("선택값이 없어도 검색 가능한 최소 문서를 만든다", () => {
    const result = buildRecipeRecommendationDocument({
      ...RECIPE_SOURCE,
      summary: null,
      chef_tip: null,
      steps: [],
      ingredients: [],
      category: null,
      tags: [],
      tools: null,
      difficulty: null,
      time_minutes: null,
      servings: null,
    });

    expect(result.searchText).toBe("제목: 김치볶음밥");
    expect(result.ingredientNames).toEqual([]);
  });

  test("같은 재료가 여러 번 나와도 검색 문서에는 이름을 한 번만 적는다", () => {
    const result = buildRecipeRecommendationDocument({
      ...RECIPE_SOURCE,
      ingredients: [
        { name: " 대파 ", amount: "1", unit: "custom", unitCustom: "대" },
        { name: "대파", amount: "0.5", unit: "custom", unitCustom: "대" },
        { name: "Egg", amount: "2", unit: "개", unitCustom: "" },
        { name: "egg", amount: "1", unit: "개", unitCustom: "" },
      ],
    });

    expect(result.searchText).toContain("\n재료: 대파, Egg\n");
    expect(result.ingredientNames).toEqual(["대파", "egg"]);
  });

  test("수량·난이도·시간·인분은 검색 문서에 쓰지 않고 필터 값으로만 남긴다", () => {
    const result = buildRecipeRecommendationDocument(RECIPE_SOURCE);

    expect(result.searchText).not.toMatch(/[0-9]|공기|쉬움|인분|필요/);
    expect(result).toMatchObject({ difficulty: "쉬움", timeMinutes: 10, toolsRequired: true });
  });

  test("공백 제목은 검색 문서로 만들지 않는다", () => {
    expect(() => buildRecipeRecommendationDocument({ ...RECIPE_SOURCE, title: "   " })).toThrow(
      "추천 문서의 제목이 필요합니다."
    );
  });
});

describe("buildComboRecommendationDocument", () => {
  test("콤보 구성은 검색 문서에, 0분 준비 시간은 필터 값에 담는다", () => {
    const result = buildComboRecommendationDocument(COMBO_SOURCE);

    expect(result).toEqual({
      sourceType: "combo",
      sourceId: "combo-1",
      title: "토스트 아침 세트",
      searchText: [
        "제목: 토스트 아침 세트",
        "설명: 가벼운 아침 식사",
        "태그: 아침, 간단",
        "구성: 토스트 - 바삭한 토스트, 그릭요거트 - 150g",
        "준비 순서: 접시에 함께 담는다",
      ].join("\n"),
      category: null,
      difficulty: "하",
      timeMinutes: 0,
      toolsRequired: false,
      ingredientNames: ["토스트", "그릭요거트"],
    });
  });
});
