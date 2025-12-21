import { z } from "zod";
import type { Tables } from "@/types/supabase";
import { recipeFormSchema, recipeInsertSchema, recipeListOptionsSchema, recipeUpdateSchema } from "./schema";

export type RecipeRow = Tables<"recipes">;

export interface Recipe {
  id: string;
  title: string;
  summary: string | null;
  recipe: string | null;
  ingredients: RecipeIngredient[];
  image: string | null;
  category: string | null;
  tags: string[];
  difficulty?: string | null;
  timeMinutes?: number | null;
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
}

export type RecipeIngredient = {
  name: string;
  amount: string;
  unit: string;
  unitCustom?: string;
};

export type RecipeInsertInput = z.infer<typeof recipeInsertSchema>;
export type RecipeUpdateInput = z.infer<typeof recipeUpdateSchema>;
export type RecipeListOptions = z.infer<typeof recipeListOptionsSchema>;

export interface RecipeListResult {
  items: Recipe[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export type FetchRecipesParams = {
  limit: number;
  offset: number;
  tags?: string[];
  writerUid?: string;
  search?: string;
};

export type RecipeInsertDB = {
  id?: string;
  title: string;
  summary?: string | null;
  recipe?: string;
  ingredients?: RecipeIngredient[];
  image?: string | null;
  category?: string | null;
  tags?: string[];
  difficulty?: string | null;
  time_minutes?: number | null;
  servings?: number | null;
  writer_uid?: string | null;
  writer_name?: string | null;
  writer_email?: string | null;
};

export type RecipeUpdateDB = {
  title?: string;
  summary?: string | null;
  recipe?: string;
  ingredients?: RecipeIngredient[];
  image?: string | null;
  category?: string | null;
  tags?: string[];
  difficulty?: string | null;
  time_minutes?: number | null;
  servings?: number | null;
};

export type RecipeWriterInfo = {
  uid?: string | null;
  name?: string | null;
  email?: string | null;
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
  | "__custom__";

  export type IngredientInput = {
    name: string;
    amount: string;
    unit: IngredientUnit;
    unitCustom: string;
  };
  
export type StepInput = { text: string };

export type FormValues = z.infer<typeof recipeFormSchema> & {
  ingredients: IngredientInput[];
  steps: StepInput[];
  summary: string;
  recipe: string;
  category: string;
  tags: string[];
};
