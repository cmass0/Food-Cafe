import { escapeArrayValue, normalizeSearchTerm } from "@/lib/domain/repo/querypattern";
import type { Database } from "@/types/supabase";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import {
  ComboInsertRow,
  ComboRow,
  ComboUpdateRow,
  FetchCombosParams,
  fetchCombosResult,
} from "./types";

function throwIfError(error: PostgrestError | null): void {
  if (error) throw error;
}

export async function fetchCombos(
  client: SupabaseClient<Database>,
  params: FetchCombosParams
): Promise<fetchCombosResult> {
  const safeLimit = Math.max(params.limit, 1);
  const safeOffset = Math.max(params.offset, 0);
  const rangeEnd = safeOffset + safeLimit - 1;

  let query = client.from("combos").select("*", { count: "exact" });

  if (params.sort === "like") {
    query = query.order("like_count", { ascending: false });
  } else if (params.sort === "view") {
    query = query.order("view_count", { ascending: false });
  }
  query = query
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(safeOffset, Math.max(rangeEnd, safeOffset));

  // 검색 조건 분기
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
    // 필드 선택 검색
    const searchstr = `%${search}%`;
    const tag = escapeArrayValue(search);
    if (params.searchField === "title") {
      query = query.ilike("title", searchstr);
    }
    if (params.searchField === "writer") {
      query = query.ilike("writer_name", searchstr);
    }
    if (params.searchField === "tag") {
      query = query.contains("tags", [search]);
    }
    if (params.searchField === "tag_title") {
      query = query.or(`title.ilike.${searchstr},tags.cs.{${tag}}`);
    }
  }
  if (params.writerUid) {
    query = query.eq("writer_uid", params.writerUid);
  }

  const { data, error, count } = await query;
  throwIfError(error);

  return {
    items: data || [],
    total: count ?? 0,
  };
}

export async function selectCombobyBookmarked(
  client: SupabaseClient<Database>,
  params: FetchCombosParams,
  id: string
): Promise<fetchCombosResult> {
  const safeLimit = Math.max(params.limit, 1);
  const safeOffset = Math.max(params.offset, 0);
  const rangeEnd = safeOffset + safeLimit - 1;

  let query = client
    .from("combo_bookmarks")
    .select("created_at, combos:combo_id!inner(*)", { count: "exact" })
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  // 검색 조건 분기
  const rawSearch = params.search ?? "";
  const search = normalizeSearchTerm(rawSearch);
  if (rawSearch.trim().length > 0 && !search) {
    return { items: [], total: 0 };
  }
  if (search) {
    // 전체 검색
    if (!params.searchField) {
      query = query.textSearch("combos.tsv", search, { type: "websearch", config: "simple" });
    }
    // 필드 선택 검색
    const searchstr = `%${search}%`;
    const tag = escapeArrayValue(search);
    if (params.searchField === "title") {
      query = query.ilike("combos.title", searchstr);
    }
    if (params.searchField === "writer") {
      query = query.ilike("combos.writer_name", searchstr);
    }
    if (params.searchField === "tag") {
      query = query.contains("combos.tags", [search]);
    }
    if (params.searchField === "tag_title") {
      query = query.or(`combos.title.ilike.${searchstr},combos.tags.cs.{${tag}}`);
    }
  }

  const { data, error, count } = await query.range(safeOffset, Math.max(rangeEnd, safeOffset));
  throwIfError(error);

  const items = (data ?? []).map((row) => row.combos).filter((combo) => Boolean(combo));
  return {
    items,
    total: count ?? 0,
  };
}

export async function selectByCombobyLiked(
  client: SupabaseClient<Database>,
  params: FetchCombosParams,
  id: string
): Promise<fetchCombosResult> {
  const safeLimit = Math.max(params.limit, 1);
  const safeOffset = Math.max(params.offset, 0);
  const rangeEnd = safeOffset + safeLimit - 1;

  let query = client
    .from("combo_likes")
    .select("created_at, combos:combo_id!inner(*)", { count: "exact" })
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  // 검색 조건 분기
  const rawSearch = params.search ?? "";
  const search = normalizeSearchTerm(rawSearch);
  if (rawSearch.trim().length > 0 && !search) {
    return { items: [], total: 0 };
  }
  if (search) {
    // 전체 검색
    if (!params.searchField) {
      query = query.textSearch("combos.tsv", search, { type: "websearch", config: "simple" });
    }
    // 필드 선택 검색
    const searchstr = `%${search}%`;
    const tag = escapeArrayValue(search);
    if (params.searchField === "title") {
      query = query.ilike("combos.title", searchstr);
    }
    if (params.searchField === "writer") {
      query = query.ilike("combos.writer_name", searchstr);
    }
    if (params.searchField === "tag") {
      query = query.contains("combos.tags", [search]);
    }
    if (params.searchField === "tag_title") {
      query = query.or(`combos.title.ilike.${searchstr},combos.tags.cs.{${tag}}`);
    }
  }

  const { data, error, count } = await query.range(safeOffset, Math.max(rangeEnd, safeOffset));
  throwIfError(error);

  const items = (data ?? []).map((row) => row.combos).filter((combo) => Boolean(combo));
  return {
    items,
    total: count ?? 0,
  };
}

export async function fetchComboById(
  client: SupabaseClient<Database>,
  comboId: string
): Promise<ComboRow | null> {
  const { data, error } = await client.from("combos").select("*").eq("id", comboId).maybeSingle();
  // id가 유효한 UUID 형식이 아니면 Postgres가 22P02 에러를 던진다.
  // 이 경우 "없는 조합"으로 간주해 notFound(404)로 흘려보낸다.
  if (error?.code === "22P02") return null;
  throwIfError(error);

  return data;
}

export async function insertCombo(
  client: SupabaseClient<Database>,
  comboData: ComboInsertRow
): Promise<ComboRow> {
  const { data, error } = await client.from("combos").insert(comboData).select("*").single();
  throwIfError(error);
  if (!data) {
    throw new Error("레시피를 생성하는데 실패했습니다.");
  }
  return data;
}

export async function updateCombo(
  client: SupabaseClient<Database>,
  comboId: string,
  writerUid: string,
  comboData: ComboUpdateRow
): Promise<ComboRow | null> {
  const { data, error } = await client
    .from("combos")
    .update(comboData)
    .eq("id", comboId)
    .eq("writer_uid", writerUid)
    .select("*")
    .maybeSingle();
  throwIfError(error);
  return data;
}

export async function deleteCombo(
  client: SupabaseClient<Database>,
  comboId: string,
  writerUid: string
): Promise<boolean> {
  const { data, error } = await client
    .from("combos")
    .delete()
    .eq("id", comboId)
    .eq("writer_uid", writerUid)
    .select("id")
    .maybeSingle();
  throwIfError(error);
  return Boolean(data);
}
