export const POST_CATEGORY_VALUES = ["free", "recipe_tip", "question", "review"] as const;

export type PostCategory = (typeof POST_CATEGORY_VALUES)[number];

// 카테고리 종류 및 라벨 정의
export const POST_CATEGORY_OPTIONS: ReadonlyArray<{
  value: PostCategory;
  label: string;
  shortLabel: string;
  className: string;
}> = [
  {
    value: "free",
    label: "자유게시판",
    shortLabel: "자유",
    className: "bg-emerald-50 text-emerald-700",
  },
  {
    value: "recipe_tip",
    label: "레시피 팁",
    shortLabel: "레시피 팁",
    className: "bg-lime-50 text-lime-700",
  },
  {
    value: "question",
    label: "질문&답변",
    shortLabel: "질문",
    className: "bg-violet-50 text-violet-700",
  },
  {
    value: "review",
    label: "후기",
    shortLabel: "후기",
    className: "bg-orange-50 text-orange-700",
  },
];

const CATEGORY_SET = new Set<string>(POST_CATEGORY_VALUES);

const LEGACY_CATEGORY_MAP: Record<string, PostCategory> = {
  board: "free",
  free: "free",
  자유: "free",
  자유게시판: "free",
  info: "recipe_tip",
  recipe_tip: "recipe_tip",
  정보: "recipe_tip",
  정보공유: "recipe_tip",
  "레시피 팁": "recipe_tip",
  question: "question",
  qna: "question",
  질문: "question",
  "질문&답변": "question",
  review: "review",
  후기: "review",
  후기게시판: "review",
};

// 카테고리 유효성 검사
export function isPostCategory(value: unknown): value is PostCategory {
  return typeof value === "string" && CATEGORY_SET.has(value);
}

export function normalizePostCategory(value: string | null | undefined): PostCategory | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  return LEGACY_CATEGORY_MAP[normalized] ?? LEGACY_CATEGORY_MAP[normalized.toLowerCase()];
}

export function getPostCategoryOption(category: PostCategory) {
  return POST_CATEGORY_OPTIONS.find((option) => option.value === category)!;
}

export function getPostCategoryLabel(category: PostCategory): string {
  return getPostCategoryOption(category).label;
}
