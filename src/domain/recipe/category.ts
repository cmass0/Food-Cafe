// 배달 앱처럼 "오늘 뭐 먹지"를 고르는 기준으로 나눈다. 나라별(한식·중식…)과 요리 형태별(고기·구이,
// 분식…)이 섞여 있으므로, 두 곳에 걸치면 요리 형태 쪽을 고른다(예: 제육볶음은 한식이 아니라 고기·구이).
export const RECIPE_CATEGORIES = [
  "한식",
  "고기·구이",
  "분식",
  "중식",
  "일식",
  "양식",
  "아시안",
  "샐러드·건강식",
  "디저트·베이킹",
  "간식·야식",
  "기타",
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export const RECIPE_CATEGORY_KEYS = [
  "korean",
  "meat",
  "bunsik",
  "chinese",
  "japanese",
  "western",
  "asian",
  "salad",
  "dessert",
  "snack",
] as const;

export type RecipeCategoryKey = (typeof RECIPE_CATEGORY_KEYS)[number];

export const RECIPE_CATEGORY_FILTERS: Record<
  RecipeCategoryKey,
  { label: RecipeCategory; values: readonly RecipeCategory[] }
> = {
  korean: { label: "한식", values: ["한식"] },
  meat: { label: "고기·구이", values: ["고기·구이"] },
  bunsik: { label: "분식", values: ["분식"] },
  chinese: { label: "중식", values: ["중식"] },
  japanese: { label: "일식", values: ["일식"] },
  western: { label: "양식", values: ["양식"] },
  asian: { label: "아시안", values: ["아시안"] },
  salad: { label: "샐러드·건강식", values: ["샐러드·건강식"] },
  dessert: { label: "디저트·베이킹", values: ["디저트·베이킹"] },
  snack: { label: "간식·야식", values: ["간식·야식"] },
};

export function isRecipeCategoryKey(value: string | null | undefined): value is RecipeCategoryKey {
  return RECIPE_CATEGORY_KEYS.some((category) => category === value);
}

export function isRecipeCategory(value: string | null | undefined): value is RecipeCategory {
  return RECIPE_CATEGORIES.some((category) => category === value);
}

// 저장된 카테고리 값에서 목록 필터 키를 찾는다. 필터가 없는 "기타"와 목록 밖 값은 undefined다.
export function getRecipeCategoryKey(
  category: string | null | undefined
): RecipeCategoryKey | undefined {
  return RECIPE_CATEGORY_KEYS.find((key) =>
    RECIPE_CATEGORY_FILTERS[key].values.some((value) => value === category)
  );
}

export function getRecipeCategoryLabel(category: RecipeCategoryKey): string {
  return RECIPE_CATEGORY_FILTERS[category].label;
}

export function getRecipeCategoryValues(category: RecipeCategoryKey): readonly string[] {
  return RECIPE_CATEGORY_FILTERS[category].values;
}
