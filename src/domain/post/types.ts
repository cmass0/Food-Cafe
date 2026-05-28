import type { Json, Tables } from "@/types/supabase";

export type PostRow = Tables<"posts">;

export type PostInsertDB = {
  title: string;
  content_json: Json;
  content_html?: string | null;
  content_text?: string | null;
  writer_uid: string;
  writer_name: string;
  type?: string;
};

export type PostCreateInput = {
  title: string;
  content_json: string;
  content_text?: string | null;
  writer_uid: string;
  writer_name: string;
  type?: string;
};

export type PostUpdateDB = Partial<{
  title: string;
  content_json: Json;
  content_html: string | null;
  content_text: string | null;
  writer_name: string;
  type: string;
}>;

export type PostUpdateInput = Partial<{
  title: string;
  content_json: Json | string;
  content_html: string | null;
  content_text: string | null;
  writer_name: string;
  type: string;
}>;

export interface Post {
  id: string;
  title: string;
  contentJson: Json | null;
  contentHtml: string | null;
  contentText: string | null;
  writerName: string;
  writerUid: string | null;
  number: number | null;
  viewCount: number;
  commentCount: number;
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
