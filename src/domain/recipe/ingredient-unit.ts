// 재료 단위 선택지. 작성 폼의 단위 목록과 AI 작성 도우미가 고를 수 있는 단위가 모두 이 목록을 따른다.
// "custom"을 고르면 unitCustom에 단위를 직접 적는다.
export const INGREDIENT_UNITS = [
  "g",
  "kg",
  "ml",
  "L",
  "컵",
  "큰술",
  "작은술",
  "꼬집",
  "줌",
  "개",
  "마리",
  "custom",
] as const;

export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];
