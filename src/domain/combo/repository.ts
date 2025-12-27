import type { Database } from "@/types/supabase";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import {
  ComboInsertRow,
  ComboListOptions,
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

  let query = client
    .from("combos")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id")
    .range(safeOffset, Math.max(rangeEnd, safeOffset));

  if (params.tags && params.tags.length > 0) {
    query = query.contains("tags", params.tags);
  }
  if (params.search) {
    query = query.textSearch("tsv", params.search, { type: "websearch" });
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

export async function fetchComboById(
  client: SupabaseClient<Database>,
  comboId: string
): Promise<ComboRow | null> {
  const { data, error } = await client.from("combos").select("*").eq("id", comboId).maybeSingle();
  throwIfError(error);

  return data;
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

  if (params.tags && params.tags.length > 0) {
    query = query.contains("combos.tags", params.tags);
  }

  if (params.search) {
    query = query.textSearch("combos.tsv", params.search, { type: "websearch" });
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

  if (params.tags && params.tags.length > 0) {
    query = query.contains("combos.tags", params.tags);
  }
  if (params.search) {
    query = query.textSearch("combos.tsv", params.search, { type: "websearch" });
  }

  const { data, error, count } = await query.range(safeOffset, Math.max(rangeEnd, safeOffset));
  throwIfError(error);

  const items = (data ?? []).map((row) => row.combos).filter((combo) => Boolean(combo));
  return {
    items,
    total: count ?? 0,
  };
}

export async function insertCombo(
  client: SupabaseClient<Database>,
  comboData: ComboInsertRow
): Promise<ComboInsertRow> {
  const { data, error } = await client.from("combos").insert(comboData).select("*").single();
  throwIfError(error);
  if (!data) {
    throw new Error("콤보를 생성하지 못했습니다.");
  }
  return data;
}

export async function updateCombo(
  client: SupabaseClient<Database>,
  comboId: string,
  comboData: ComboUpdateRow
): Promise<ComboUpdateRow> {
  const { data, error } = await client
    .from("combos")
    .update(comboData)
    .eq("id", comboId)
    .select("*")
    .single();
  throwIfError(error);
  if (!data) {
    throw new Error("콤보를 수정하지 못했습니다.");
  }
  return data;
}

export async function deleteCombo(
  client: SupabaseClient<Database>,
  comboId: string
): Promise<void> {
  const { error } = await client.from("combos").delete().eq("id", comboId);
  throwIfError(error);
}
