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

describe("레시피 조리 단계 개수와 길이", () => {
  const steps = (count: number, length = 10) =>
    Array.from({ length: count }, () => ({ description: "가".repeat(length) }));

  test.each([
    ["생성", recipeInsertSchema],
    ["수정", recipeUpdateSchema],
  ] as const)("%s 규칙은 단계 50개·단계당 500자까지 허용한다", (_label, schema) => {
    const result = schema.safeParse({ ...BASE_RECIPE, steps: steps(50, 500) });

    expect(result.success).toBe(true);
  });

  test.each([
    ["생성", recipeInsertSchema],
    ["수정", recipeUpdateSchema],
  ] as const)("%s 규칙은 단계 51개를 거부한다", (_label, schema) => {
    const result = schema.safeParse({ ...BASE_RECIPE, steps: steps(51) });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([["steps"]]);
  });

  test.each([
    ["생성", recipeInsertSchema],
    ["수정", recipeUpdateSchema],
  ] as const)("%s 규칙은 501자 단계를 거부한다", (_label, schema) => {
    const result = schema.safeParse({ ...BASE_RECIPE, steps: steps(1, 501) });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([["steps", 0, "description"]]);
  });

  test("앞뒤 공백은 빼고 센다", () => {
    const result = recipeInsertSchema.safeParse({
      ...BASE_RECIPE,
      steps: [{ description: `  ${"가".repeat(500)}  ` }],
    });

    expect(result.success).toBe(true);
  });
});

describe("레시피 재료 개수", () => {
  const ingredients = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      name: `재료${index + 1}`,
      amount: "1",
      unit: "개",
    }));

  test.each([
    ["생성", recipeInsertSchema],
    ["수정", recipeUpdateSchema],
  ] as const)("%s 규칙은 재료 200개까지 허용한다", (_label, schema) => {
    const result = schema.safeParse({ ...BASE_RECIPE, ingredients: ingredients(200) });

    expect(result.success).toBe(true);
  });

  // 수정할 때는 개수를 보지 않아, 작성 때 막은 201개를 수정으로 저장할 수 있었다.
  test.each([
    ["생성", recipeInsertSchema],
    ["수정", recipeUpdateSchema],
  ] as const)("%s 규칙은 재료 201개를 거부한다", (_label, schema) => {
    const result = schema.safeParse({ ...BASE_RECIPE, ingredients: ingredients(201) });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([["ingredients"]]);
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
