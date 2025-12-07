import type { PostgrestError } from "@supabase/supabase-js";

import type {
  FetchRecipesParams,
  RecipeInsertDB,
  RecipeRow,
  RecipeSupabaseClient,
  RecipeUpdateDB,
} from "./types";

function throwIfError(error: PostgrestError | null): void {
  if (error) throw error;
}

export type FetchRecipesResult = {
  items: RecipeRow[];
  total: number;
};

export async function fetchRecipes(
  client: RecipeSupabaseClient,
  params: FetchRecipesParams,
): Promise<FetchRecipesResult> {
  const safeLimit = Math.max(params.limit, 1);
  const safeOffset = Math.max(params.offset, 0);
  const rangeEnd = safeOffset + safeLimit - 1;
  let query = client
    .from("recipes")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(safeOffset, Math.max(rangeEnd, safeOffset));

  if (params.tag) {
    query = query.contains("tags", [params.tag]);
  }

  if (params.status !== undefined) {
    query = query.eq("status", params.status);
  }

  if (params.writerUid) {
    query = query.eq("writer_uid", params.writerUid);
  }

  if (params.search) {
    query = query.textSearch("tsv", params.search, { type: "plain" });
  }

  const { data, error, count } = await query;
  throwIfError(error);
  return {
    items: (data as RecipeRow[]) ?? [],
    total: count ?? 0,
  };
}

export async function selectRecipeById(
  client: RecipeSupabaseClient,
  id: string
): Promise<RecipeRow | null> {
  const { data, error } = await client
    .from("recipes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return data ?? null;
}

export async function insertRecipeRecord(
  client: RecipeSupabaseClient,
  payload: RecipeInsertDB
): Promise<RecipeRow> {
  const { data, error } = await client
    .from("recipes")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  if (!data) {
    throw new Error("레시피를 생성하지 못했습니다.");
  }
  return data as RecipeRow;
}

export async function updateRecipeRecordByOwner(
  client: RecipeSupabaseClient,
  id: string,
  payload: RecipeUpdateDB
): Promise<RecipeRow> {
  const { data, error } = await client.from("recipes").update(payload).eq("id", id).select("*").single();
  throwIfError(error);
  if (!data) {
    throw new Error("레시피를 수정하지 못했습니다.");
  }
  return data as RecipeRow;
}

export async function deleteRecipeRecord(client: RecipeSupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("recipes").delete().eq("id", id);
  throwIfError(error);
}
