import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/supabase";

export type PostRow = Tables<"posts">;

// export interface PostRow {
//   id: string;
//   title: string;
//   content: string;
//   writer_uid: string | null;
//   writer_name: string;
//   type: string | null;
//   number: number | null;
//   view_count: number | null;
//   created_at: string;
//   updated_at: string;
// }

export type PostInsertDB = {
  title: string;
  content: string;
  writer_uid: string;
  writer_name: string;
  type?: string;
};

export type PostUpdateDB = Partial<{
  title: string;
  content: string;
  writer_name: string;
  type: string;
}>;

export type PostSupabaseClient = SupabaseClient<Database>;

export interface Post {
  id: string;
  title: string;
  content: string;
  writerName: string;
  writerUid: string | null;
  number: number | null;
  check: number;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PostListResult = {
  items: Post[];
  nextCursor: string | null;
};

export type PostListOptions = {
  limit?: number;
  cursor?: string;
  writerUid?: string;
  type?: string;
  search?: string;
};

export type PostCursorFilter = {
  createdAt: string;
  id: string;
};

export type FetchPostsParams = {
  limit: number;
  cursor?: PostCursorFilter | null;
  writerUid?: string;
  type?: string;
  search?: string;
};
