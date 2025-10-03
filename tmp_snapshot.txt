import type { SupabaseClient } from "@supabase/supabase-js";

export interface RecipeRow {
  id: string;
  id_text_old: string;
  legacy_id: string | null;
  title: string;
  summary: string | null;
  recipe: string | null;
  image: string | null;
  images: string[] | null;
  category: string | null;
  tags: string[] | null;
  like_count: number;
  view_count: number;
  last_liked_at: string | null;
  status: number | null;
  writer_uid: string | null;
  writer_uid_legacy: string | null;
  writer_name: string | null;
  writer_email: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface RecipeUpdateInput extends Partial<RecipeInsertInput> {
  likeCount?: number;
  viewCount?: number;
  lastLikedAt?: string | null;
}

export interface RecipeListOptions {
  limit?: number;
  cursor?: string;
  tag?: string;
  status?: number;
  writerUid?: string;
  search?: string;
}

export interface RecipeListResult {
  items: Recipe[];
  nextCursor: string | null;
}

export type RecipeSupabaseClient = SupabaseClient<any>;


