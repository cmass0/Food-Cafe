import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";
import type { FetchPostsParams, PostInsertDB, PostRow, PostUpdateDB } from "./types";

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

export type FetchPostsResult = {
  items: PostRow[];
  total: number;
};

export async function fetchPosts(
  client: SupabaseClient<Database>,
  params: FetchPostsParams
): Promise<FetchPostsResult> {
  const safeLimit = Math.max(params.limit, 1);
  const safeOffset = Math.max(params.offset, 0);
  const rangeEnd = safeOffset + safeLimit - 1;
  let query = (client as any)
    .from("posts")
    .select(POST_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(safeOffset, Math.max(rangeEnd, safeOffset));

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
      query = query.or(`title.ilike.%${pattern}%,writer_name.ilike.%${pattern}%`);
    }
  }

  const { data, error, count } = await query;
  throwIfError(error);
  return {
    items: mapRows(data),
    total: count ?? 0,
  };
}

export async function selectPostById(
  client: SupabaseClient<Database>,
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
  client: SupabaseClient<Database>,
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
  client: SupabaseClient<Database>,
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
  client: SupabaseClient<Database>,
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
