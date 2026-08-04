import type { Json, Tables } from "@/types/supabase";
import type { PostCategory } from "./category";

export type PostRow = Tables<"posts">;

export type PostInsertDB = {
  title: string;
  content_json: Json;
  content_html: string;
  content_text: string;
  writer_uid: string;
  writer_name: string;
  category: PostCategory;
};

export type PostCreateInput = {
  title: string;
  content_json: Json | string;
  category: PostCategory;
};

export type PostUpdateDB = Partial<{
  title: string;
  content_json: Json;
  content_html: string | null;
  content_text: string | null;
  category: PostCategory;
}>;

export type PostUpdateInput = Partial<{
  title: string;
  content_json: Json | string;
  category: PostCategory;
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
  likeCount: number;
  commentCount: number;
  category: PostCategory;
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
  sort?: "recent" | "likes";
  writerUid?: string;
  category?: PostCategory;
  search?: string;
  searchField?: PostSearchField;
};

export type FetchPostsParams = {
  limit: number;
  offset: number;
  sort?: "recent" | "likes";
  writerUid?: string;
  category?: PostCategory;
  search?: string;
  searchField?: PostSearchField;
};

export type PostSearchField = "title" | "writer" | "contents" | "title_contents";
