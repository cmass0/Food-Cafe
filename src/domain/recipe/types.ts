import type { Database } from "@/types/supabase";
import { z } from "zod";
import { recipeFormSchema } from "./schema";

//repo 용
export type RecipeRow = Database["public"]["Tables"]["recipes"]["Row"];
export type RecipeInsertRow = Database["public"]["Tables"]["recipes"]["Insert"];
export type RecipeUpdateRow = Database["public"]["Tables"]["recipes"]["Update"];

export interface Recipe {
  id: string;
  title: string;
  summary: string | null;
  steps: RecipeStep[];
  ingredients: RecipeIngredient[];
  image: string | null;
  category: string | null;
  tags: string[];
  tools: string[] | null;
  toolsRequired: boolean;
  difficulty: string | null;
  timeMinutes: number | null;
  servings?: number | null;
  likeCount: number;
  viewCount: number;
  writerUid: string | null;
  writerName: string | null;
  writerEmail: string | null;
  lastLikedAt: string | null;
  createdAt: Date;
  updatedAt: Date;
  liked?: boolean;
  bookmarked?: boolean;
  bookmarkCount: number;
}

export type RecipeListOptions = {
  limit?: number;
  page?: number;

  writerUid?: string;
  search?: string;
  searchField?: RecipeSearchField;
};

export type RecipeIngredient = {
  name: string;
  amount: string;
  unit: string;
  unitCustom?: string;
};

export type RecipeListResult = {
  items: Recipe[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type FetchRecipesParams = {
  limit: number;
  offset: number;

  writerUid?: string;
  search?: string;
  searchField?: RecipeSearchField;
};

export type RecipeSearchField = "tag" | "title" | "tag_title" | "writer";

// DB Insert 용
export type RecipeInsertDB = {
  id?: string;
  title: string;
  summary?: string | null;
  steps: RecipeStep[];
  ingredients?: RecipeIngredient[];
  image?: string | null;
  category?: string | null;
  tags?: string[];
  tools?: string[] | null;
  tools_required?: boolean;
  difficulty?: string | null;
  time_minutes?: number | null;
  servings?: number | null;
  writer_uid?: string | null;
  writer_name?: string | null;
  writer_email?: string | null;
};

// DB Update 용
export type RecipeUpdateDB = {
  title?: string;
  summary?: string | null;
  steps?: RecipeStep[];
  ingredients?: RecipeIngredient[];
  image?: string | null;
  category?: string | null;
  tags?: string[];
  tools?: string[] | null;
  tools_required?: boolean;
  difficulty?: string | null;
  time_minutes?: number | null;
  servings?: number | null;
};

export type RecipeWriterInfo = {
  uid?: string | null;
  name?: string | null;
  email?: string | null;
};

export type StepInput = {
  description: string;
};

export type RecipeStep = {
  description: string;
};

export type IngredientUnit =
  | "g"
  | "kg"
  | "ml"
  | "L"
  | "개"
  | "장"
  | "컵"
  | "큰술"
  | "작은술"
  | "꼬집"
  | "custom";

export type IngredientInput = {
  name: string;
  amount: string;
  unit: IngredientUnit;
  unitCustom: string;
};

export type FormValues = z.infer<typeof recipeFormSchema>;

export type FetchRecipesResult = {
  items: RecipeRow[];
  total: number;
};

export type BookmarkedJoinRow = {
  created_at: string | null;
  recipes: RecipeRow | null;
};

export type UserLikeJoinRow = {
  created_at: string | null;
  recipes: RecipeRow | null;
};
