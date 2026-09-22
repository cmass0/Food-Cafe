import type { ComboItems, ComboRow } from "@/domain/combo/types";
import type { RecipeIngredient, RecipeRow } from "@/domain/recipe/types";

export const RECOMMEND_RECIPE_SORTS = ["popular", "recent"] as const;
export const RECOMMEND_SOURCE_TYPES = ["recipe", "combo"] as const;

export type RecommendRecipeSort = (typeof RECOMMEND_RECIPE_SORTS)[number];
export type RecommendSourceType = (typeof RECOMMEND_SOURCE_TYPES)[number];

export type RecommendationRecipeDocumentSource = Pick<
  RecipeRow,
  | "id"
  | "title"
  | "summary"
  | "chef_tip"
  | "steps"
  | "ingredients"
  | "category"
  | "tags"
  | "tools"
  | "tools_required"
  | "difficulty"
  | "time_minutes"
  | "servings"
>;

export type RecommendationComboDocumentSource = Pick<
  ComboRow,
  | "id"
  | "title"
  | "summary"
  | "steps"
  | "items"
  | "tags"
  | "tools"
  | "tools_required"
  | "difficulty"
  | "time_minutes"
>;

export type RecommendationDocument = {
  sourceType: RecommendSourceType;
  sourceId: string;
  title: string;
  searchText: string;
  category: string | null;
  difficulty: string | null;
  timeMinutes: number | null;
  toolsRequired: boolean;
  ingredientNames: string[];
};

export type RecommendRecipeRow = Pick<
  RecipeRow,
  | "id"
  | "title"
  | "summary"
  | "category"
  | "tags"
  | "tools"
  | "tools_required"
  | "difficulty"
  | "time_minutes"
  | "servings"
  | "ingredients"
  | "like_count"
  | "bookmark_count"
  | "comment_count"
  | "view_count"
  | "created_at"
>;

export type RecommendRecipeSearch = {
  query: string;
  ingredients: string[];
  maxTimeMinutes?: number;
  sort: RecommendRecipeSort;
  limit: number;
};

export type RecommendRecipeCandidate = {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  tags: string[];
  tools: string[];
  toolsRequired: boolean;
  difficulty: string | null;
  timeMinutes: number | null;
  servings: number | null;
  ingredients: RecipeIngredient[];
  ingredientCount: number;
  likeCount: number;
  bookmarkCount: number;
  commentCount: number;
  viewCount: number;
};

export type RecommendRecipeSearchResult = {
  items: RecommendRecipeCandidate[];
  query: string;
  appliedIngredients: string[];
};

export type RecommendComboRow = Pick<
  ComboRow,
  | "id"
  | "title"
  | "summary"
  | "items"
  | "tags"
  | "tools"
  | "tools_required"
  | "difficulty"
  | "time_minutes"
  | "like_count"
  | "bookmark_count"
  | "comment_count"
  | "view_count"
>;

export type RecommendationSearch = {
  query: string;
  sourceTypes: RecommendSourceType[];
  category?: string;
  difficulty?: string;
  maxTimeMinutes?: number;
  toolsRequired?: boolean;
  includeIngredients: string[];
  excludeIngredients: string[];
};

export type RecommendationQueryEmbedding = {
  embedding: number[];
  modelId: string;
};

export type RecommendationRank = {
  sourceType: RecommendSourceType;
  sourceId: string;
  // keywordRank/semanticRank 중 한쪽이 null이면 해당 검색 방식의 후보에는 없었다는 뜻이다.
  // score는 두 순위를 RRF로 합친 최종 정렬값이며 사용자 평점이나 정확도 퍼센트가 아니다.
  score: number;
  keywordRank: number | null;
  semanticRank: number | null;
  semanticSimilarity: number | null;
};

export type RecommendationRecipeCandidate = RecommendRecipeCandidate & {
  sourceType: "recipe";
  rank: Omit<RecommendationRank, "sourceType" | "sourceId">;
};

export type RecommendationComboCandidate = {
  sourceType: "combo";
  id: string;
  title: string;
  summary: string | null;
  items: ComboItems[];
  itemCount: number;
  tags: string[];
  tools: string[];
  toolsRequired: boolean;
  difficulty: string | null;
  timeMinutes: number | null;
  likeCount: number;
  bookmarkCount: number;
  commentCount: number;
  viewCount: number;
  rank: Omit<RecommendationRank, "sourceType" | "sourceId">;
};

export type RecommendationCandidate = RecommendationRecipeCandidate | RecommendationComboCandidate;

export type RecommendationSearchResult = {
  items: RecommendationCandidate[];
  query: string;
  appliedFilters: {
    sourceTypes: RecommendSourceType[];
    category: string | null;
    difficulty: string | null;
    maxTimeMinutes: number | null;
    toolsRequired: boolean | null;
    includeIngredients: string[];
    excludeIngredients: string[];
  };
};
