import { describe, expect, test } from "vitest";

import {
  keepSelectedRecipes,
  SELECTED_RECIPE_PROMPT_LIMITS,
  toSelectedRecipePrompt,
  type SelectedRecipe,
} from "./selected-recipes";
import type { ComboWritingDraft, WritingResponse } from "./types";

const RICE = "00000000-0000-4000-8000-000000000001";
const SOUP = "00000000-0000-4000-8000-000000000002";
const selected = [
  { id: RICE, title: "김치볶음밥" },
  { id: SOUP, title: "계란국" },
];
type Item = ComboWritingDraft["items"][number];
const product = (name: string): Item => ({ type: "product", productName: name, summary: "" });
const recipe = (id: string, title: string): Item => ({ type: "recipe", recipeid: id, title });

function combo(items: Item[]): WritingResponse {
  return {
    kind: "combo",
    outline: { title: "한 끼", points: ["밥", "국"] },
    question: null,
    suggestions: [],
    notices: [],
    draft: {
      title: "한 끼",
      summary: "",
      difficulty: "쉬움",
      time_minutes: 20,
      tags: [],
      tools: [],
      steps: [{ description: "함께 낸다." }],
      items,
    },
  };
}
function itemsOf(response: WritingResponse) {
  return response.kind === "combo" ? response.draft?.items : undefined;
}

describe("keepSelectedRecipes", () => {
  test("AI가 바꿔 쓴 레시피 이름은 원본 제목으로 되돌린다", () => {
    const result = keepSelectedRecipes(
      combo([recipe(RICE, "매콤 김치볶음밥"), recipe(SOUP, "계란국")]),
      selected
    );
    expect(itemsOf(result)).toEqual([recipe(RICE, "김치볶음밥"), recipe(SOUP, "계란국")]);
  });
  test("AI가 뺀 고른 레시피는 초안 끝에 다시 넣는다", () => {
    const result = keepSelectedRecipes(
      combo([recipe(RICE, "김치볶음밥"), product("단무지")]),
      selected
    );
    expect(itemsOf(result)).toEqual([
      recipe(RICE, "김치볶음밥"),
      product("단무지"),
      recipe(SOUP, "계란국"),
    ]);
  });
  test("같은 레시피를 두 번 넣었으면 하나만 남긴다", () => {
    const result = keepSelectedRecipes(
      combo([recipe(RICE, "김치볶음밥"), recipe(RICE, "김치볶음밥"), recipe(SOUP, "계란국")]),
      selected
    );
    expect(itemsOf(result)).toEqual([recipe(RICE, "김치볶음밥"), recipe(SOUP, "계란국")]);
  });
  test("AI가 고른 레시피 ID를 대문자로 돌려줘도 같은 레시피로 보고 원본 제목으로 한 번만 남긴다", () => {
    const lettered = RICE.replace("0000", "abcd");
    const result = keepSelectedRecipes(
      combo([recipe(lettered.toUpperCase(), "매콤 김치볶음밥"), product("단무지")]),
      [{ id: lettered, title: "김치볶음밥" }]
    );
    expect(itemsOf(result)).toEqual([recipe(lettered, "김치볶음밥"), product("단무지")]);
  });
  test("두 번 넣은 레시피를 하나로 줄여 항목이 2개보다 적으면 초안을 쓰지 않는다", () => {
    expect(() =>
      keepSelectedRecipes(
        combo([recipe(RICE, "김치볶음밥"), recipe(RICE, "김치볶음밥")]),
        selected.slice(0, 1)
      )
    ).toThrow("조합 항목이 2개보다 적습니다.");
  });
  test("두 번 넣은 레시피를 하나로 줄여도 빠진 고른 레시피를 다시 넣어 2개면 그대로 쓴다", () => {
    const result = keepSelectedRecipes(
      combo([recipe(RICE, "김치볶음밥"), recipe(RICE, "김치볶음밥")]),
      selected
    );
    expect(itemsOf(result)).toEqual([recipe(RICE, "김치볶음밥"), recipe(SOUP, "계란국")]);
  });
  test("다시 넣어 10개를 넘으면 AI가 제안한 상품을 뒤에서부터 뺀다", () => {
    const products = Array.from({ length: 9 }, (_, index) => product(`상품 ${index + 1}`));
    const result = keepSelectedRecipes(combo([recipe(RICE, "김치볶음밥"), ...products]), selected);
    expect(itemsOf(result)).toEqual([
      recipe(RICE, "김치볶음밥"),
      ...products.slice(0, 8),
      recipe(SOUP, "계란국"),
    ]);
  });
  test("다시 넣어도 10개면 상품을 빼지 않는다", () => {
    const products = Array.from({ length: 8 }, (_, index) => product(`상품 ${index + 1}`));
    const result = keepSelectedRecipes(combo([recipe(RICE, "김치볶음밥"), ...products]), selected);
    expect(itemsOf(result)).toHaveLength(10);
  });
  test("고른 레시피가 없으면 AI 초안을 그대로 둔다", () => {
    const response = combo([product("컵라면"), product("즉석밥")]);
    expect(keepSelectedRecipes(response, [])).toEqual(response);
  });
  test("초안이 아직 없는 응답은 그대로 둔다", () => {
    const response = { ...combo([]), draft: null };
    expect(keepSelectedRecipes(response, selected)).toEqual(response);
  });
});

describe("toSelectedRecipePrompt", () => {
  const { ingredients, steps, stepChars } = SELECTED_RECIPE_PROMPT_LIMITS;
  function recipeOf(patch: Partial<SelectedRecipe>): SelectedRecipe {
    return {
      id: RICE,
      title: "김치볶음밥",
      summary: null,
      timeMinutes: 15,
      ingredients: [],
      steps: [],
      ...patch,
    };
  }
  test("상한을 넘는 재료·단계는 앞에서부터 자르고 전체 단계 수를 함께 넘긴다", () => {
    const result = toSelectedRecipePrompt(
      recipeOf({
        ingredients: Array.from({ length: ingredients + 1 }, (_, index) => ({
          name: `재료 ${index + 1}`,
          amount: "1",
          unit: "개",
        })),
        steps: Array.from({ length: steps + 1 }, (_, index) => ({
          description: `단계 ${index + 1}`,
        })),
      })
    );
    expect(result.ingredients).toHaveLength(ingredients);
    expect(result.ingredients.at(-1)).toBe(`재료 ${ingredients}`);
    expect(result.steps).toHaveLength(steps);
    expect(result.stepCount).toBe(steps + 1);
  });
  test.each([
    ["상한 글자 수", stepChars, "가".repeat(stepChars)],
    ["상한보다 한 글자 많음", stepChars + 1, `${"가".repeat(stepChars)}…`],
  ] as const)("단계 글이 %s이면 상한까지만 넘긴다", (_label, size, expected) => {
    const result = toSelectedRecipePrompt(
      recipeOf({ steps: [{ description: "가".repeat(size) }] })
    );
    expect(result.steps).toEqual([expected]);
  });
  test("요약이 없으면 빈 글로 넘긴다", () => {
    expect(toSelectedRecipePrompt(recipeOf({ summary: null })).summary).toBe("");
  });
});
