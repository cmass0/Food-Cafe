import type { PostgrestError } from "@supabase/supabase-js";

import type {
  FetchPostsParams,
  PostInsertDB,
  PostRow,
  PostSupabaseClient,
  PostUpdateDB,
} from "./types";

const POST_COLUMNS = [
  "id",
  "title",
  "content",
  "writer_uid",
  "writer_name",
  "type",
  "number",
  "view_count",
  "created_at",
  "updated_at",
].join(", ");

function mapRows(rows: unknown): PostRow[] {
  return Array.isArray(rows) ? (rows as PostRow[]) : [];
}

function throwIfError(error: PostgrestError | null): void {
  if (error) throw error;
}

function escapeIlike(term: string): string {
  return term.replace(/[%_]/g, (match) => `\\${match}`);
}

export async function fetchPosts(
  client: PostSupabaseClient,
  params: FetchPostsParams
): Promise<PostRow[]> {
  const safeLimit = Math.max(params.limit, 1);
  let query = (client as any)
    .from("posts")
    .select(POST_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(safeLimit);

  if (params.writerUid) {
    query = query.eq("writer_uid", params.writerUid);
  }

  if (params.type) {
    query = query.eq("type", params.type);
  }

  if (params.search) {
    const term = params.search.trim();
    if (term.length > 0) {
      const pattern = escapeIlike(term);
      query = query.or(
        `title.ilike.%${pattern}%,writer_name.ilike.%${pattern}%`
      );
    }
  }

  if (params.cursor) {
    const { createdAt, id } = params.cursor;
    query = query.or(
      `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.gt.${id})`
    );
  }

  const { data, error } = await query;
  throwIfError(error);
  return mapRows(data);
}

export async function selectPostById(
  client: PostSupabaseClient,
  id: string
): Promise<PostRow | null> {
  const { data, error } = await (client as any)
    .from("posts")
    .select(POST_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return (data as PostRow | null) ?? null;
}

export async function insertPostRecord(
  client: PostSupabaseClient,
  payload: PostInsertDB
): Promise<PostRow> {
  const { data, error } = await (client as any)
    .from("posts")
    .insert(payload)
    .select(POST_COLUMNS)
    .single();
  throwIfError(error);
  if (!data) throw new Error("게시글을 생성하지 못했습니다.");
  return data as PostRow;
}

export async function updatePostRecordByOwner(
  client: PostSupabaseClient,
  id: string,
  ownerUid: string,
  payload: PostUpdateDB
): Promise<PostRow | null> {
  const { data, error } = await (client as any)
    .from("posts")
    .update(payload)
    .eq("id", id)
    .eq("writer_uid", ownerUid)
    .select(POST_COLUMNS)
    .maybeSingle();
  throwIfError(error);
  return (data as PostRow | null) ?? null;
}

export async function deletePostRecord(
  client: PostSupabaseClient,
  id: string,
  ownerUid: string
): Promise<void> {
  const { error } = await (client as any)
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("writer_uid", ownerUid);
  throwIfError(error);
}

export async function incrementPostViewCount(
  client: PostSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await (client as any).rpc("increment_post_view_count", { target: id });
  throwIfError(error);
}
