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
  writerUid: string | null;
  writerName: string | null;
  writerEmail: string | null;
  lastLikedAt: string | null;
  createdAt: Date;
  updatedAt: Date;
  liked?: boolean;
}

export interface RecipeInsertInput {
  id?: string;
  title: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string;
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
  id?: string;
  title: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string | null;
  category?: string | null;
  tags?: string[];
  writer_uid?: string | null;
  writer_name?: string | null;
  writer_email?: string | null;
};

export type RecipeUpdateDB = {
  title?: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string | null;
  category?: string | null;
  tags?: string[];
};

export type RecipeWriterInfo = {
  uid?: string | null;
  name?: string | null;
  email?: string | null;
};