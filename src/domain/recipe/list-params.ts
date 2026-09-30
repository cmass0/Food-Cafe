import { MAX_RECIPE_LIST_LIMIT } from "./schema";
import type { RecipeSearchField, RecipeSort } from "./types";

// 레시피 목록 주소(?page=&limit=&sort=&searchField=)의 조회 조건을 해석한다. 목록 페이지와 목록 API가 같은 규칙을 쓴다.
// 잘못된 값은 오류로 돌려주지 않고 "지정 안 함"(undefined)으로 바꿔, 부른 쪽의 기본값을 쓰게 한다.

function positiveInteger(value: string | null | undefined): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

// 1 이상의 정수만 페이지 번호로 받는다. 0·음수·소수·숫자가 아닌 값은 지정 안 함으로 본다.
export function parseRecipeListPage(value: string | null | undefined): number | undefined {
  return positiveInteger(value);
}

// 페이지 크기도 1 이상의 정수만 받고, 상한을 넘으면 상한으로 줄인다.
export function parseRecipeListLimit(value: string | null | undefined): number | undefined {
  const parsed = positiveInteger(value);
  return parsed === undefined ? undefined : Math.min(parsed, MAX_RECIPE_LIST_LIMIT);
}

export function parseRecipeSort(value: string | null | undefined): RecipeSort | undefined {
  return value === "recent" || value === "like" || value === "view" ? value : undefined;
}

export function parseRecipeSearchField(
  value: string | null | undefined
): RecipeSearchField | undefined {
  return value === "tag" || value === "title" || value === "tag_title" || value === "writer"
    ? value
    : undefined;
}
