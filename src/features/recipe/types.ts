import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/supabase";

export type RecipeRow = Tables<"recipes">;

export interface Recipe {
  id: string;
  idTextOld?: string | null;
  legacyId?: string | null;
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
  writerUid: string | null;
  writerUidLegacy?: string | null;
  writerName: string | null;
  writerEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeInsertInput {
  idTextOld?: string | null;
  legacyId?: string | null;
  title: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string | null;
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
  category?: string | null;
  tags?: string[];
  status?: number | null;
  writerUid?: string | null;
  writerUidLegacy?: string | null;
  writerName?: string | null;
  writerEmail?: string | null;
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

// Supabase 테이블과 동일하지만 사용 중인 필드만 명시
export type RecipeInsertDB = {
  id_text_old?: string | null;
  legacy_id?: string | null;
  title: string;
  summary: string | null;
  recipe: string | null;
  image: string | null;
  category: string | null;
  tags: string[];
  status: number | null;
  writer_uid: string | null;
  writer_uid_legacy?: string | null;
  writer_name: string | null;
  writer_email: string | null;
};

export type RecipeUpdateDB = {
  title?: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string | null;
  category?: string | null;
  tags?: string[];
  status?: number | null;
  writer_uid?: string | null;
  writer_uid_legacy?: string | null;
  writer_name?: string | null;
  writer_email?: string | null;
};
