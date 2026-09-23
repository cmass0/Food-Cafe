import type { SupabaseClient } from "@supabase/supabase-js";
import * as repository from "./repository";

import { resolveLimit, resolveOffset } from "@/lib/pagination";
import type { Database } from "@/types/supabase";
import { readCommentParent, toCommentParentColumns } from "./parent";
import { commentInsertSchema, commentListOptionsSchema, commentUpdateSchema } from "./schema";
import {
  Comment,
  CommentInsertInput,
  CommentInsertRow,
  CommentListOptions,
  CommentListResult,
  CommentParentType,
  CommentRow,
  CommentUpdateRow,
} from "./types";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;

function mapRowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    ...readCommentParent(row),
    writerUid: row.writer_uid,
    writerName: row.writer_name,
    content: row.content,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
  };
}

function buildInsertPayload(
  parsed: ReturnType<typeof commentInsertSchema.parse>
): CommentInsertRow {
  return {
    content: parsed.content,
    ...toCommentParentColumns(parsed.parentType, parsed.parentId),
    writer_uid: parsed.writerUid,
  };
}

function buildUpdatePayload(
  parsed: ReturnType<typeof commentUpdateSchema.parse>
): Partial<CommentUpdateRow> {
  const payload: Partial<CommentUpdateRow> = {};
  if (parsed.content !== undefined) payload.content = parsed.content;
  return payload;
}

export async function listComments(
  client: SupabaseClient<Database>,
  options?: CommentListOptions
): Promise<CommentListResult> {
  const parsed = commentListOptionsSchema.parse(options);
  const limit = resolveLimit(parsed.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = resolveOffset(parsed.page, limit);

  const { items: rows, total: rawTotal } = await repository.fetchComments(client, {
    parentType: parsed.parentType,
    parentId: parsed.parentId,
    limit,
    offset,
  });
  const items = rows.map(mapRowToComment);
  const total = Math.max(rawTotal, offset + items.length);
  const hasMore = offset + items.length < total;
  return {
    items,
    total,
    limit,
    offset,
    hasMore,
  };
}

export async function getComment(
  client: SupabaseClient<Database>,
  id: string
): Promise<Comment | null> {
  const row = await repository.selectCommentById(client, id);
  return row ? mapRowToComment(row) : null;
}

// 응답 표준: 댓글 자체 + 부모 entity의 새 comment_count
// "Mutation은 새 카운트를 응답에 포함한다" 원칙에 맞춰 트리거가 갱신한 값을 같이 반환
export type CommentMutationResult = {
  comment: Comment;
  parentCommentCount: number;
};

export async function createComment(
  client: SupabaseClient<Database>,
  writerUid: string,
  input: CommentInsertInput
): Promise<CommentMutationResult> {
  const parsed = commentInsertSchema.parse({ ...(input as object), writerUid });
  const payload = buildInsertPayload(parsed);
  const row = await repository.insertComment(client, payload);
  const comment = mapRowToComment(row);
  // 트리거가 부모 테이블의 comment_count를 이미 +1 해놓은 상태 — 그 값을 읽어 함께 반환
  const parentCommentCount = await repository.selectParentCommentCount(
    client,
    comment.parentType,
    comment.parentId
  );
  return { comment, parentCommentCount };
}

export async function updateComment(
  client: SupabaseClient<Database>,
  id: string,
  writerUid: string,
  input: unknown
): Promise<Comment | null> {
  const parsed = commentUpdateSchema.parse(input);
  const payload = buildUpdatePayload(parsed);
  const row = await repository.updateComment(client, id, writerUid, payload);
  if (!row) return null;
  return mapRowToComment(row);
}

// 삭제 응답: 갱신된 부모 카운트와 parent 정보
// 트리거가 deleted_at 갱신을 감지해 카운트를 -1 한 직후 값을 읽어 반환
export type CommentDeleteResult = {
  parentType: CommentParentType;
  parentId: string;
  parentCommentCount: number;
};

export async function deleteComment(
  client: SupabaseClient<Database>,
  id: string,
  writerUid: string
): Promise<CommentDeleteResult | null> {
  // 부모 정보가 응답에 필요하므로 삭제 직전에 row를 한 번 조회
  const target = await repository.selectCommentByOwner(client, id, writerUid);
  if (!target) return null;

  const deleted = await repository.deleteComment(client, id, writerUid);
  if (!deleted) return null;
  const parent = readCommentParent(target);
  const parentCommentCount = await repository.selectParentCommentCount(
    client,
    parent.parentType,
    parent.parentId
  );
  return { ...parent, parentCommentCount };
}
