import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type RecipeRow = Tables<"recipes">;

export interface Recipe {
  id: string;
  idTextOld: string;
  legacyId: string | null;
  title: string;
  summary: string | null;
  recipe: string | null;
  image: string | null;
  images: string[];
  category: string | null;
  tags: string[];
  likeCount: number;
  viewCount: number;
  lastLikedAt: string | null;
  status: number | null;
  writerUid: string | null;
  writerUidLegacy: string | null;
  writerName: string | null;
  writerEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeInsertInput {
  idTextOld?: string;
  legacyId?: string | null;
  title: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string | null;
  images?: string[];
  category?: string | null;
  tags?: string[];
  status?: number | null;
  writerUid?: string | null;
  writerUidLegacy?: string | null;
  writerName?: string | null;
  writerEmail?: string | null;
}

export interface RecipeUpdateInput {
  title?: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string | null;
  images?: string[];
  category?: string | null;
  tags?: string[];
}

export interface RecipeListOptions {
  limit?: number;
  page?: number;
  tag?: string;
  status?: number;
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
  status?: number;
  writerUid?: string;
  search?: string;
};

export type RecipeSupabaseClient = SupabaseClient<Database>;
export type RecipeInsertDB = TablesInsert<"recipes">;
export type RecipeUpdateDB = TablesUpdate<"recipes">;
