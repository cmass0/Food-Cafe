import { CommentInsertDB, CommentRow, CommentSupabaseClient, FetchCommentsParams } from "./types";

function mapRows(rows: CommentRow[]): CommentRow[] {
  return Array.isArray(rows) ? (rows as CommentRow[]) : [];
}

export async function fetchComments(
  client: CommentSupabaseClient,
  params: FetchCommentsParams,
): Promise<CommentRow[]> {

  let query = client
    .from("comments")
    .select("*")
    .eq("parent_type", params.parentType)
    .eq("parent_id", params.parentId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(params.limit); 

  if (!params.includeDeleted) {
    query = query.is("deleted_at", null);
  }


  if (params.cursor) {
    query = query.or(
      `created_at.lt.${params.cursor.createdAt},and(created_at.eq.${params.cursor.createdAt},id.gt.${params.cursor.id})`
    );
  }
  
  const { data, error } = await query;
  if (error) throw error; 

  return mapRows(data);
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
    throw new Error("댓글을 찾을 수 없습니다.");
  }
  return data ?? null;
}

export async function insertComment(
  client: CommentSupabaseClient,
  payload: CommentInsertDB,
): Promise<CommentRow> {
  const { data, error } = await client
    .from("comments")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  if (!data) {
    throw new Error("댓글을 생성하지 못했습니다.");
  }
  return data;
}

export async function updateComment(
  client: CommentSupabaseClient,
  id: string,
  payload: Partial<CommentInsertDB>,
): Promise<CommentRow> {
  const { data, error } = await client
    .from("comments")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  if (!data) {
    throw new Error("댓글을 업데이트하지 못했습니다.");
  }
  return data;
}

export async function deleteComment(
  client: CommentSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from("comments").delete().eq("id", id);
  if (error) throw error;
} 