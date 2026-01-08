import type { Tables } from "@/types/supabase";

export type PostRow = Tables<"posts">;

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
  total: number;
  limit: number;
  hasMore: boolean;
  offset: number;
};

export type PostListOptions = {
  limit?: number;
  page?: number;
  writerUid?: string;
  type?: string;
  search?: string;
  searchField?: PostSearchField;
};

export type FetchPostsParams = {
  limit: number;
  offset: number;
  writerUid?: string;
  type?: string;
  search?: string;
  searchField?: PostSearchField;
};

export type PostSearchField = "title" | "writer" | "contents" | "title_contents";
