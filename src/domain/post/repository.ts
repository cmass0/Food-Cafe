import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { normalizeSearchTerm } from "@/lib/domain/repo/querypattern";
import type { Database } from "@/types/supabase";
import type { FetchPostsParams, PostInsertDB, PostRow, PostUpdateDB } from "./types";

const POST_COLUMNS = [
  "id",
  "title",
  "content_json",
  "content_html",
  "content_text",
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

  const rawSearch = params.search ?? "";
  const search = normalizeSearchTerm(rawSearch);
  if (rawSearch.trim().length > 0 && !search) {
    return { items: [], total: 0 };
  }
  if (search) {
    // 전체 검색
    if (!params.searchField) {
      query = query.textSearch("tsv", search, { type: "websearch", config: "simple" });
    }
    // 각 page별 필드선택 후 검색
    const searchstr = `%${search}%`;
    if (params.searchField === "title") {
      query = query.ilike("title", searchstr);
    }
    if (params.searchField === "writer") {
      query = query.ilike("writer_name", searchstr);
    }
    if (params.searchField === "contents") {
      query = query.ilike("content_text", searchstr);
    }
    if (params.searchField === "title_contents") {
      query = query.or(`title.ilike.${searchstr},content_text.ilike.${searchstr}`);
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

