
import * as repository from "./repository";
import { commentInsertSchema, commentUpdateSchema } from "./schema";
import { Comment, CommentInsertDB, CommentListResult, CommentRow, CommentSupabaseClient } from "./types";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;

function resolveLimit(limit?: number): number {
  if (typeof limit !== "number" || Number.isNaN(limit)) return DEFAULT_LIMIT;
  const truncated = Math.trunc(limit);
  if (truncated < 1) return 1;
  if (truncated > MAX_LIMIT) return MAX_LIMIT;
  return truncated;
}

function resolveOffset(page: number | undefined, limit: number): number {
  
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
  // if (input.parentId !== undefined) payload.parent_id = input.parentId;
  // if (input.parentType !== undefined) payload.parent_type = input.parentType;
  if (input.writerName !== undefined) payload.writer_name = input.writerName;
  return payload;
}



export async function listComments(
  client: CommentSupabaseClient,
  params: {   
    parentType: "recipe" | "post";
    parentId: string;
    page?: number;
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
  }
): Promise<CommentListResult> {
  const parsedLimit = resolveLimit(params.limit);
  const offset = resolveOffset(params.page, parsedLimit);
  const { items: rows, total: rawTotal } = await repository.fetchComments(client, {
    parentType: params.parentType,
    parentId: params.parentId,  
    limit: parsedLimit,
    offset,
    includeDeleted: params.includeDeleted ?? false,
  });

  const items = rows.map(mapRowToComment);
  const total = Math.max(rawTotal, offset + items.length);  
  const hasMore = offset + items.length < total;
  return {
    items,
    total,
    limit: parsedLimit,
    hasMore,
  };
}

export async function getComment(
  client: CommentSupabaseClient, 
  id: string) : Promise<Comment | null> {
  const row = await repository.selectCommentById(client, id);
  return row ? mapRowToComment(row) : null;
}

export async function createComment(
  client: CommentSupabaseClient,
  writerUid: string,  
  input: unknown,
): Promise<Comment> {
  const parsed = commentInsertSchema.parse(input);
  const payload = buildInsertPayload(parsed, writerUid);
  const row = await repository.insertComment(client, payload);
  return mapRowToComment(row);
}

export async function updateComment(
  client: CommentSupabaseClient,
  id: string,
  input: unknown,
): Promise<Comment> {
  const parsed = commentUpdateSchema.parse(input);
  const payload = buildUpdatePayload(parsed);
  const row = await repository.updateComment(client, id, payload);
  if(!row) {
    throw new Error("댓글을 찾을 수 없습니다.");
  }
  return mapRowToComment(row);
}

export async function deleteComment(
  client: CommentSupabaseClient,
  id: string): Promise<void> {
    await repository.deleteComment(client, id);

}

  
  


  