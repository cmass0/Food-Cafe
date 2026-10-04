import type { Json, Tables } from "@/types/supabase";
import type { PostCategory } from "./category";

export type PostRow = Tables<"posts">;

export type PostInsertDB = {
  id?: string;
  title: string;
  content_json: Json;
  content_html: string;
  content_text: string;
  writer_uid: string;
  category: PostCategory;
};

export type PostCreateInput = {
  id?: string;
  title: string;
  content_json: Json | string;
  // 브라우저 에디터가 만든 본문 HTML. 서버가 저장 전에 정제한다.
  content_html: string;
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
  content_html: string;
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
  bookmarkCount: number;
  commentCount: number;
  // 화면에서 로그인 사용자가 누른 좋아요·북마크인지 붙인 값(features/my-reactions).
  liked?: boolean;
  bookmarked?: boolean;
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
  sort?: "recent" | "likes" | "views";
  writerUid?: string;
  category?: PostCategory;
  search?: string;
  searchField?: PostSearchField;
};

export type FetchPostsParams = {
  limit: number;
  offset: number;
  sort?: "recent" | "likes" | "views";
  writerUid?: string;
  category?: PostCategory;
  search?: string;
  searchField?: PostSearchField;
};

export type PostSearchField = "title" | "writer" | "contents" | "title_contents";
