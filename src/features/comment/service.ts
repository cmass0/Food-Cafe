import * as repository from "./repository";
import { commentInsertSchema } from "./schema";
import { Comment, CommentInsertDB, CommentRow } from "./types";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;

function resolveLimit(limit?: number): number {
  if (typeof limit !== "number" || Number.isNaN(limit)) return DEFAULT_LIMIT;
  const truncated = Math.trunc(limit);
  if (truncated < 1) return 1;
  if (truncated > MAX_LIMIT) return MAX_LIMIT;
  return truncated;
}

function resolveOffset(offset: number | undefined, page: number | undefined, limit: number): number {
  if (typeof offset === "number" && Number.isFinite(offset)) {
    return Math.max(0, Math.trunc(offset));
  }
  if (typeof page === "number" && Number.isFinite(page)) {
    const safePage = Math.max(1, Math.trunc(page));
    return (safePage - 1) * limit;
  }    
  return 0;
}
function mapRowToComment(row: CommentRow): Comment {
  return {
    content: row.content,
    createdAt: new Date(row.created_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    id: row.id,
    parentId: row.parent_id,
    parentType: row.parent_type,
    updatedAt: new Date(row.updated_at),
    writerName: row.writer_name,
    writerUid: row.writer_uid,
  };
}

function buildInsertPayload(
  input: ReturnType<typeof commentInsertSchema.parse>,
  writerUid: string
): CommentInsertDB {
  return {
    content: input.content,
    parent_id: input.parentId,
    parent_type: input.parentType,
    writer_name: input.writerName,
    writer_uid: writerUid,
  };
}

function buildUpdatePayload(
  input: Partial<ReturnType<typeof commentInsertSchema.parse>>
): Partial<CommentInsertDB> { 
  const payload: Partial<CommentInsertDB> = {};
  if (input.content !== undefined) payload.content = input.content;
  if (input.parentId !== undefined) payload.parent_id = input.parentId;
  if (input.parentType !== undefined) payload.parent_type = input.parentType;
  if (input.writerName !== undefined) payload.writer_name = input.writerName;
  return payload;
}
  
  


  