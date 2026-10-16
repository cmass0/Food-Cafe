import { MAX_COMBO_ITEMS, MIN_COMBO_ITEMS } from "@/domain/combo/schema";
import type { Recipe } from "@/domain/recipe/types";
import type { ComboWritingDraft, WritingResponse } from "./types";

// 고른 레시피를 AI에 넘길 때의 상한. 레시피가 여러 개여도 프롬프트가 지나치게 길어지지 않게 자른다.
export const SELECTED_RECIPE_PROMPT_LIMITS = { ingredients: 15, steps: 8, stepChars: 120 };

export type SelectedRecipe = Pick<
  Recipe,
  "id" | "title" | "summary" | "timeMinutes" | "ingredients" | "steps"
>;

export function unavailableRecipesNotice(count: number) {
  return `레시피 ${count}개를 불러오지 못해 빼고 만들었어요. 조합 폼에서 레시피 ID를 확인해 주세요.`;
}

// AI가 조합 조리 단계를 쓸 수 있게 재료 이름·시간·앞부분 단계만 요약해 넘긴다.
export function toSelectedRecipePrompt(recipe: SelectedRecipe) {
  const { ingredients, steps, stepChars } = SELECTED_RECIPE_PROMPT_LIMITS;
  return {
    id: recipe.id,
    title: recipe.title,
    summary: recipe.summary ?? "",
    timeMinutes: recipe.timeMinutes,
    ingredients: recipe.ingredients.slice(0, ingredients).map((item) => item.name),
    stepCount: recipe.steps.length,
    steps: recipe.steps
      .slice(0, steps)
      .map((step) =>
        step.description.length > stepChars
          ? `${step.description.slice(0, stepChars)}…`
          : step.description
      ),
  };
}

// 사용자가 고른 레시피는 AI가 빼거나 이름을 바꿔도 원본대로 조합에 남긴다.
export function keepSelectedRecipes(
  response: WritingResponse,
  selected: Pick<SelectedRecipe, "id" | "title">[]
): WritingResponse {
  if (response.kind !== "combo" || !response.draft) return response;
  const titles = new Map(selected.map((recipe) => [recipe.id, recipe.title]));
  const seen = new Set<string>();
  const items = response.draft.items.flatMap<ComboWritingDraft["items"][number]>((item) => {
    if (item.type !== "recipe") return [item];
    // 고른 레시피 ID는 DB처럼 소문자다. AI가 대문자로 돌려줘도 같은 레시피로 짝짓는다.
    const recipeid = item.recipeid.toLowerCase();
    if (seen.has(recipeid)) return [];
    seen.add(recipeid);
    return [{ ...item, recipeid, title: titles.get(recipeid) ?? item.title }];
  });
  for (const recipe of selected) {
    if (!seen.has(recipe.id)) {
      items.push({ type: "recipe", recipeid: recipe.id, title: recipe.title });
    }
  }
  // 다시 넣어 상한을 넘으면 AI가 제안한 상품을 뒤에서부터 뺀다.
  for (let index = items.length - 1; items.length > MAX_COMBO_ITEMS && index >= 0; index--) {
    if (items[index]?.type === "product") items.splice(index, 1);
  }
  // 같은 레시피를 두 번 넣어 최소 개수를 채운 초안은 중복을 지우면 조합이 되지 않는다.
  // 1개짜리 초안을 내보내지 않고 생성 실패로 돌려 다시 시도하게 한다.
  if (items.length < MIN_COMBO_ITEMS) {
    throw new Error(`조합 항목이 ${MIN_COMBO_ITEMS}개보다 적습니다.`);
  }
  return { ...response, draft: { ...response.draft, items } };
}
