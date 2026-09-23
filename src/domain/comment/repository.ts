import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { COMMENT_PARENT_COLUMNS } from "./parent";
import type {
  CommentInsertRow,
  CommentParentType,
  CommentRow,
  CommentUpdateRow,
  FetchCommentsParams,
} from "./types";

function mapRows(rows: CommentRow[]): CommentRow[] {
  return Array.isArray(rows) ? (rows as CommentRow[]) : [];
}

export type FetchCommentsResult = {
  items: CommentRow[];
  total: number;
};

export async function fetchComments(
  client: SupabaseClient<Database>,
  params: FetchCommentsParams
): Promise<FetchCommentsResult> {
  const limit = Math.max(params.limit, 1);
  const offset = Math.max(params.offset, 0);

  const query = client
    .from("comments")
    .select("*", { count: "exact" })
    .eq(COMMENT_PARENT_COLUMNS[params.parentType], params.parentId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, Math.max(offset + limit - 1, offset));

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    items: mapRows(data),
    total: count ?? 0,
  };
}

export async function selectCommentById(
  client: SupabaseClient<Database>,
  id: string
): Promise<CommentRow | null> {
  const { data, error } = await client.from("comments").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error("Comment not found.");
  }
  return data ?? null;
}

export async function selectCommentByOwner(
  client: SupabaseClient<Database>,
  id: string,
  writerUid: string
): Promise<CommentRow | null> {
  const { data, error } = await client
    .from("comments")
    .select("*")
    .eq("id", id)
    .eq("writer_uid", writerUid)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function insertComment(
  client: SupabaseClient<Database>,
  payload: CommentInsertRow
): Promise<CommentRow> {
  const { data, error } = await client.from("comments").insert(payload).select("*").single();
  if (error) throw error;
  if (!data) {
    throw new Error("Failed to create comment.");
  }
  return data as CommentRow;
}

export async function updateComment(
  client: SupabaseClient<Database>,
  id: string,
  writerUid: string,
  payload: Partial<CommentUpdateRow>
): Promise<CommentRow | null> {
  const { data, error } = await client
    .from("comments")
    .update(payload)
    .eq("id", id)
    .eq("writer_uid", writerUid)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data as CommentRow | null) ?? null;
}

export async function deleteComment(
  client: SupabaseClient<Database>,
  id: string,
  writerUid: string
): Promise<boolean> {
  const deletedAt = new Date().toISOString();
  const { data, error } = await client
    .from("comments")
    .update({ deleted_at: deletedAt })
    .eq("id", id)
    .eq("writer_uid", writerUid)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

// 부모 entity의 최신 comment_count 조회
// 트리거가 갱신해놓은 값을 그대로 읽기만 함 — service에서 응답에 실어보내기 위해 사용
export async function selectParentCommentCount(
  client: SupabaseClient<Database>,
  parentType: CommentParentType,
  parentId: string
): Promise<number> {
  const table = parentType === "recipe" ? "recipes" : parentType === "combo" ? "combos" : "posts";
  const { data, error } = await client
    .from(table)
    .select("comment_count")
    .eq("id", parentId)
    .maybeSingle();
  if (error) throw error;
  return (data?.comment_count as number | undefined) ?? 0;
}
