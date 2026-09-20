import type { RecipeIngredient, RecipeRow } from "@/domain/recipe/types";

export const RECOMMEND_RECIPE_SORTS = ["popular", "recent"] as const;

export type RecommendRecipeSort = (typeof RECOMMEND_RECIPE_SORTS)[number];

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
  url: string;
};

export type RecommendRecipeSearchResult = {
  items: RecommendRecipeCandidate[];
  query: string;
  appliedIngredients: string[];
};
