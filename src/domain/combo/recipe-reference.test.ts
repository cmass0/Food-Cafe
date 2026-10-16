import { describe, expect, test } from "vitest";

import { parseRecipeReference } from "./recipe-reference";

const RECIPE_ID = "00000000-0000-4000-8000-000000000001";

describe("parseRecipeReference", () => {
  test.each([
    ["레시피 ID", RECIPE_ID],
    ["앞뒤 공백이 있는 ID", `  ${RECIPE_ID}  `],
    ["레시피 링크", `https://food.example/recipes/${RECIPE_ID}`],
    ["끝에 /가 붙은 링크", `https://food.example/recipes/${RECIPE_ID}/`],
    ["쿼리가 붙은 링크", `https://food.example/recipes/${RECIPE_ID}?from=combo`],
    ["해시가 붙은 링크", `https://food.example/recipes/${RECIPE_ID}#steps`],
    ["쿼리와 해시가 함께 붙은 링크", `https://food.example/recipes/${RECIPE_ID}?from=combo#steps`],
    ["사이트 안 경로", `/recipes/${RECIPE_ID}`],
  ] as const)("%s에서 레시피 ID를 꺼낸다", (_label, input) => {
    expect(parseRecipeReference(input)).toBe(RECIPE_ID);
  });

  test.each([
    ["빈 입력", ""],
    ["공백만 있는 입력", "   "],
    ["/만 있는 입력", "/"],
    ["쿼리만 있는 입력", "?from=combo"],
    ["해시만 있는 입력", "#steps"],
  ] as const)("%s은 꺼낼 ID가 없다", (_label, input) => {
    expect(parseRecipeReference(input)).toBeNull();
  });

  test("ID 형식은 보지 않고 마지막 경로 조각을 그대로 꺼낸다", () => {
    expect(parseRecipeReference("https://food.example/recipes/not-a-uuid")).toBe("not-a-uuid");
  });
});
