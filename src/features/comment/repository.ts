import { CommentInsertDB, CommentRow, CommentSupabaseClient, CommentUpdateDB, FetchCommentsParams } from "./types";

function mapRows(rows: CommentRow[]): CommentRow[] {
  return Array.isArray(rows) ? (rows as CommentRow[]) : [];
}

export type FetchCommentsResult = {
  items: CommentRow[];
  total: number;
};

export async function fetchComments(
  client: CommentSupabaseClient,
  params: FetchCommentsParams
): Promise<FetchCommentsResult> {
  const limit = Math.max(params.limit, 1);
  const offset = Math.max(params.offset, 0);

  const query = client
    .from("comments")
    .select("*", { count: "exact" })
    .eq("parent_type", params.parentType)
    .eq("parent_id", params.parentId)
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
  client: CommentSupabaseClient,
  id: string
): Promise<CommentRow | null> {
  const { data, error } = await client
    .from("comments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error("Comment not found.");
  }
  return data ?? null;
}

export async function insertComment(
  client: CommentSupabaseClient,
  payload: CommentInsertDB
): Promise<CommentRow> {
  const { data, error } = await client
    .from("comments")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  if (!data) {
    throw new Error("Failed to create comment.");
  }
  return data as CommentRow;
}

export async function updateComment(
  client: CommentSupabaseClient,
  id: string,
  payload: Partial<CommentUpdateDB>
): Promise<CommentRow | null> {
  const { data, error } = await client
    .from("comments")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  if (!data) {
    throw new Error("Failed to update comment.");
  }
  return (data as CommentRow | null) ?? null;
}

export async function deleteComment(
  client: CommentSupabaseClient,
  id: string
): Promise<void> {
  const deletedAt = new Date().toISOString();
  const { error } = await client
    .from("comments")
    .update({ deleted_at: deletedAt })
    .eq("id", id);
  if (error) throw error;
}


