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
        "문서 버전: recommendation-document-v1",
        "콘텐츠 유형: 레시피",
        "제목: 김치볶음밥",
        "설명: 남은 재료로 만드는 한 끼",
        "카테고리: 한식",
        "태그: 자취요리, 간단",
        "재료: 김치 100 g, 밥 1 공기",
        "재료 수: 2",
        "조리 도구: 프라이팬",
        "특별한 조리 도구 필요: 예",
        "난이도: 쉬움",
        "조리 시간: 10분",
        "인분: 1인분",
        "조리 순서: 김치를 볶는다, 밥을 넣는다",
        "요리 팁: 마지막에 참기름을 넣는다",
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

    expect(result.searchText).toBe(
      [
        "문서 버전: recommendation-document-v1",
        "콘텐츠 유형: 레시피",
        "제목: 김치볶음밥",
        "재료 수: 0",
        "특별한 조리 도구 필요: 예",
      ].join("\n")
    );
    expect(result.ingredientNames).toEqual([]);
  });

  test("공백 제목은 검색 문서로 만들지 않는다", () => {
    expect(() => buildRecipeRecommendationDocument({ ...RECIPE_SOURCE, title: "   " })).toThrow(
      "추천 문서의 제목이 필요합니다."
    );
  });
});

describe("buildComboRecommendationDocument", () => {
  test("콤보 구성과 0분 준비 시간을 검색 문서에 포함한다", () => {
    const result = buildComboRecommendationDocument(COMBO_SOURCE);

    expect(result).toEqual({
      sourceType: "combo",
      sourceId: "combo-1",
      title: "토스트 아침 세트",
      searchText: [
        "문서 버전: recommendation-document-v1",
        "콘텐츠 유형: 레시피 콤보",
        "제목: 토스트 아침 세트",
        "설명: 가벼운 아침 식사",
        "태그: 아침, 간단",
        "구성: 토스트 - 바삭한 토스트, 그릭요거트 - 150g",
        "구성 수: 2",
        "특별한 조리 도구 필요: 아니오",
        "난이도: 하",
        "준비 시간: 0분",
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
