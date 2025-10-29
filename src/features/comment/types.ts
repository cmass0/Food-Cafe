



import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "@/types/supabase";

// Raw DB types from Supabase codegen
export type CommentRow = Tables<"comments">;
export type CommentInsertDB = TablesInsert<"comments">;
export type CommentUpdateDB = TablesUpdate<"comments">;
export type CommentParentType = Enums<"comment_parent_type">;

export type CommentSupabaseClient = SupabaseClient<Database>;

// Domain model used by UI/service layers
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

export type CommentCursor = {
  createdAt: string; // ISO string of created_at
  id: string;
};

export type FetchCommentsParams = {
  parentType: CommentParentType;
  parentId: string;
  limit: number;
  cursor?: CommentCursor | null;
  includeDeleted?: boolean;
};

export type CommentListResult = {
  items: Comment[];
  nextCursor: string | null;
};

export function mapRowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    parentType: row.parent_type,
    parentId: row.parent_id,
    writerUid: row.writer_uid,
    writerName: row.writer_name,
    content: row.content,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
  };
}
