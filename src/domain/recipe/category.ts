export const RECIPE_CATEGORIES = [
  "한식",
  "중식",
  "일식",
  "양식",
  "분식",
  "디저트",
  "샐러드",
  "간식",
  "다이어트",
  "기타",
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export const RECIPE_CATEGORY_KEYS = [
  "korean",
  "chinese",
  "japanese",
  "western",
  "dessert",
  "salad",
  "snack",
  "diet",
] as const;

export type RecipeCategoryKey = (typeof RECIPE_CATEGORY_KEYS)[number];

export const RECIPE_CATEGORY_FILTERS: Record<
  RecipeCategoryKey,
  { label: string; values: readonly string[] }
> = {
  korean: { label: "한식", values: ["한식"] },
  chinese: { label: "중식", values: ["중식"] },
  japanese: { label: "일식", values: ["일식"] },
  western: { label: "양식", values: ["양식", "pasta"] },
  dessert: { label: "디저트", values: ["디저트"] },
  salad: { label: "샐러드", values: ["샐러드", "salad"] },
  snack: { label: "간식", values: ["간식", "분식"] },
  diet: { label: "다이어트", values: ["다이어트"] },
};

export function isRecipeCategoryKey(value: string | null | undefined): value is RecipeCategoryKey {
  return RECIPE_CATEGORY_KEYS.some((category) => category === value);
}

export function getRecipeCategoryLabel(category: RecipeCategoryKey): string {
  return RECIPE_CATEGORY_FILTERS[category].label;
}

export function getRecipeCategoryValues(category: RecipeCategoryKey): readonly string[] {
  return RECIPE_CATEGORY_FILTERS[category].values;
}
