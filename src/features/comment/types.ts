



import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "@/types/supabase";


export type CommentRow = Tables<"comments">;
export type CommentInsertDB = TablesInsert<"comments">;
export type CommentUpdateDB = TablesUpdate<"comments">;
export type CommentParentType = Enums<"comment_parent_type">;

export type CommentSupabaseClient = SupabaseClient<Database>;


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
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
};

export type CommentlistOption = {
  limit?: number,
  page?: number,
  parentType?: "recipe" | "post";
  parentId?: string,
}

export type CommentListResult = {
  items: Comment[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};


