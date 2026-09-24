import type { Database } from "@/types/supabase";


export type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
export type CommentInsertRow = Database["public"]["Tables"]["comments"]["Insert"];
export type CommentUpdateRow = Database["public"]["Tables"]["comments"]["Update"];
export const COMMENT_PARENT_TYPES = ["recipe", "post", "combo"] as const;
export type CommentParentType = (typeof COMMENT_PARENT_TYPES)[number];



export interface Comment {
  id: string;
  parentType: CommentParentType;
  parentId: string;
  writerUid: string | null;
  writerName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type FetchCommentsParams = {
  parentType: CommentParentType;
  parentId: string;
  limit: number;
  offset: number;
};

export type CommentListOptions = {
  limit?: number;
  page?: number;
  parentType?: CommentParentType;
  parentId?: string;
};

export type CommentListResult = {
  items: Comment[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type CommentDisplayItem = {
  id: string;
  writerName: string;
  writerUid: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CommentInsertInput = {
  parentType: CommentParentType;
  parentId: string;
  content: string;
};

// JSON 직렬화 후 클라이언트가 받는 댓글 형태 (Comment의 Date 필드가 string으로 직렬화됨)
export type CommentDto = {
  id: string;
  parentType: CommentParentType;
  parentId: string;
  writerUid: string | null;
  writerName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

// Mutation 응답 — 트리거가 갱신한 부모 entity의 새 comment_count 포함
export type CommentMutationResponse = {
  comment: CommentDto;
  parentCommentCount: number;
};

export type CommentDeleteResponse = {
  parentType: CommentParentType;
  parentId: string;
  parentCommentCount: number;
};
