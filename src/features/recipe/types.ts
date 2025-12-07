import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/supabase";

export type RecipeRow = Tables<"recipes">;

export interface Recipe {
  id: string;
  title: string;
  summary: string | null;
  recipe: string | null;
  image: string | null;
  category: string | null;
  tags: string[];
  likeCount: number;
  viewCount: number;
  lastLikedAt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeInsertInput {
  title: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string | null;
  category?: string | null;
  tags?: string[];
}

export interface RecipeUpdateInput {
  title?: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string | null;
  category?: string | null;
  tags?: string[];
}

export interface RecipeListOptions {
  limit?: number;
  page?: number;
  tag?: string;
  writerUid?: string;
  search?: string;
}

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
  tag?: string;
  writerUid?: string;
  search?: string;
};

export type RecipeSupabaseClient = SupabaseClient<Database>;

export type RecipeInsertDB = {
  title: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string | null;
  category?: string | null;
  tags?: string[];
};

export type RecipeUpdateDB = {
  title?: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string | null;
  category?: string | null;
  tags?: string[];
};
