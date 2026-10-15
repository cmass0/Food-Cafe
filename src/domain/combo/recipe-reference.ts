import type { Recipe } from "@/domain/recipe/types";
import type { ComboItems } from "./types";

// 조합 레시피 칸에 넣은 레시피 ID나 레시피 링크에서 ID 자리를 꺼낸다.
// 링크는 쿼리·해시를 떼고 마지막 경로 조각을 쓴다. ID 형식 검사는 comboRecipeIdSchema가 한다.
export function parseRecipeReference(input: string) {
  const path = input.trim().split(/[?#]/)[0] ?? "";
  const parts = path.split("/").filter(Boolean);
  return parts.at(-1) ?? null;
}

export type ComboRecipeSource = Pick<Recipe, "id" | "title" | "summary" | "image">;

// 조합의 레시피 항목은 브라우저가 보낸 제목·설명·사진 대신 DB에서 읽은 레시피 값으로 채운다.
// missing은 찾지 못한 레시피 항목의 위치다. 저장하는 쪽이 이 위치로 오류를 알린다.
export function fillRecipeItems<T extends ComboItems>(items: T[], recipes: ComboRecipeSource[]) {
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const missing: number[] = [];
  const filled = items.map((item, index) => {
    if (item.type !== "recipe") return item;
    const recipe = byId.get(item.recipeid);
    if (!recipe) {
      missing.push(index);
      return item;
    }
    return {
      ...item,
      title: recipe.title,
      summary: recipe.summary ?? undefined,
      image: recipe.image,
    };
  });
  return { items: filled, missing };
}
