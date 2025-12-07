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
  status: number | null;
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
  status?: number | null;
}

export interface RecipeUpdateInput {
  title?: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string | null;
  category?: string | null;
  tags?: string[];
  status?: number | null;
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

// Supabase 테이블 정의를 기반으로, 현재 컬럼을 optional 포함해 유연하게 매핑
export type RecipeInsertDB = {
  id_text_old?: string | null;
  legacy_id?: string | null;
  title: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string | null;
  images?: string[]; // 테이블에 남아 있다면 호환용
  category?: string | null;
  tags?: string[];
  status?: number | null;
  writer_uid?: string | null;
  writer_uid_legacy?: string | null;
  writer_name?: string | null;
  writer_email?: string | null;
  like_count?: number;
  view_count?: number;
  last_liked_at?: string | null;
};

export type RecipeUpdateDB = {
  id_text_old?: string | null;
  legacy_id?: string | null;
  title?: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string | null;
  images?: string[];
  category?: string | null;
  tags?: string[];
  status?: number | null;
  writer_uid?: string | null;
  writer_uid_legacy?: string | null;
  writer_name?: string | null;
  writer_email?: string | null;
  like_count?: number;
  view_count?: number;
  last_liked_at?: string | null;
};
