import { describe, expect, test } from "vitest";

import { recipeInsertSchema, recipeUpdateSchema } from "./schema";

const TAGS_10 = Array.from({ length: 10 }, (_, index) => `태그${index + 1}`);
const TAGS_11 = [...TAGS_10, "태그11"];
const TOOLS_10 = Array.from({ length: 10 }, (_, index) => `도구${index + 1}`);
const TOOLS_11 = [...TOOLS_10, "도구11"];

const BASE_RECIPE = {
  title: "김치볶음밥",
  steps: [{ description: "재료를 볶는다" }],
  ingredients: [{ name: "밥", amount: "1", unit: "공기" }],
  category: "한식",
  difficulty: "쉬움",
  time_minutes: 10,
  servings: 1,
};

function expectFieldFailure(
  result: { success: boolean; error?: { issues: Array<{ path: Array<string | number> }> } },
  field: string
) {
  expect(result.success).toBe(false);
  if (result.success) return;
  expect(result.error?.issues.some((issue) => issue.path[0] === field)).toBe(true);
}

describe("레시피 태그와 조리도구 개수", () => {
  test.each([
    ["생성 태그", recipeInsertSchema, "tags", TAGS_10],
    ["수정 태그", recipeUpdateSchema, "tags", TAGS_10],
    ["생성 조리도구", recipeInsertSchema, "tools", TOOLS_10],
    ["수정 조리도구", recipeUpdateSchema, "tools", TOOLS_10],
  ] as const)("%s는 10개까지 허용한다", (_label, schema, field, values) => {
    const result = schema.safeParse({ ...BASE_RECIPE, [field]: values });

    expect(result.success).toBe(true);
  });

  test.each([
    ["생성 태그", recipeInsertSchema, "tags", TAGS_11],
    ["수정 태그", recipeUpdateSchema, "tags", TAGS_11],
    ["생성 조리도구", recipeInsertSchema, "tools", TOOLS_11],
    ["수정 조리도구", recipeUpdateSchema, "tools", TOOLS_11],
  ] as const)("%s는 11개를 거부한다", (_label, schema, field, values) => {
    const result = schema.safeParse({ ...BASE_RECIPE, [field]: values });

    expectFieldFailure(result, field);
  });
});

describe("레시피 카테고리", () => {
  test.each([
    ["생성", recipeInsertSchema],
    ["수정", recipeUpdateSchema],
  ] as const)("%s 스키마는 목록 밖 카테고리를 거부한다", (_label, schema) => {
    const result = schema.safeParse({ ...BASE_RECIPE, category: "디저트" });

    expectFieldFailure(result, "category");
  });

  test.each([
    ["생성", recipeInsertSchema],
    ["수정", recipeUpdateSchema],
  ] as const)("%s 스키마는 카테고리를 고르지 않은 빈 값을 받는다", (_label, schema) => {
    const result = schema.safeParse({ ...BASE_RECIPE, category: "" });

    expect(result.success).toBe(true);
  });

  test("필터가 없는 기타도 작성 카테고리로 받는다", () => {
    expect(recipeInsertSchema.safeParse({ ...BASE_RECIPE, category: "기타" }).success).toBe(true);
  });

  test("앞뒤 공백을 잘라 목록 값으로 받는다", () => {
    const result = recipeInsertSchema.safeParse({ ...BASE_RECIPE, category: "  고기·구이 " });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.category).toBe("고기·구이");
  });
});
