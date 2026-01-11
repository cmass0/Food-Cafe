import type { Database } from "@/types/supabase";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { escapeArrayValue, normalizeSearchTerm } from "@/lib/domain/repo/querypattern";
import type {
  FetchRecipesParams,
  FetchRecipesResult,
  RecipeInsertRow,
  RecipeRow,
  RecipeUpdateDB,
} from "./types";

function throwIfError(error: PostgrestError | null): void {
  if (error) throw error;
}

export async function fetchRecipes(
  client: SupabaseClient<Database>,
  params: FetchRecipesParams
): Promise<FetchRecipesResult> {
  const safeLimit = Math.max(params.limit, 1);
  const safeOffset = Math.max(params.offset, 0);
  const rangeEnd = safeOffset + safeLimit - 1;
  let query = client
    .from("recipes")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id")
    .range(safeOffset, Math.max(rangeEnd, safeOffset));

  if (params.writerUid) {
    query = query.eq("writer_uid", params.writerUid);
  }
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
    // 각 page별 필드선택 후 검색
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

  const { data, error, count } = await query;
  throwIfError(error);
  return {
    items: data || [],
    total: count ?? 0,
  };
}

export async function selectRecipeById(
  client: SupabaseClient<Database>,
  id: string
): Promise<RecipeRow | null> {
  const { data, error } = await client.from("recipes").select("*").eq("id", id).maybeSingle();
  throwIfError(error);
  return data;
}

export async function selectRecipeByBookmarked(
  client: SupabaseClient<Database>,
  userId: string,
  params: FetchRecipesParams
): Promise<FetchRecipesResult> {
  const safeLimit = Math.max(params.limit ?? 20, 1);
  const safeOffset = Math.max(params.offset ?? 0, 0);
  const rangeEnd = safeOffset + safeLimit - 1;

  let query = client
    .from("recipe_bookmarks")
    .select("created_at, recipes:parent_id!inner(*)", { count: "exact" })
    .eq("user_id", userId)
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
      query = query.textSearch("recipes.tsv", search, { type: "websearch", config: "simple" });
    }
    // 필드 선택 검색
    const searchstr = `%${search}%`;
    const tag = escapeArrayValue(search);
    if (params.searchField === "title") {
      query = query.ilike("recipes.title", searchstr);
    }
    if (params.searchField === "writer") {
      query = query.ilike("recipes.writer_name", searchstr);
    }
    if (params.searchField === "tag") {
      query = query.contains("recipes.tags", [search]);
    }
    if (params.searchField === "tag_title") {
      query = query.or(`recipes.title.ilike.${searchstr},recipes.tags.cs.{${tag}}`);
    }
  }
  const { data, error, count } = await query.range(safeOffset, Math.max(rangeEnd, safeOffset));

  throwIfError(error);

  const items = (data ?? []).map((row) => row.recipes).filter((recipe) => Boolean(recipe)); // recipe 삭제 시 필터링
  return {
    items,
    total: count ?? items.length,
  };
}

export async function selectRecipeByLike(
  client: SupabaseClient<Database>,
  id: string,
  params: FetchRecipesParams
): Promise<FetchRecipesResult> {
  const safeLimit = Math.max(params.limit ?? 20, 1);
  const safeOffset = Math.max(params.offset ?? 0, 0);
  const rangeEnd = safeOffset + safeLimit - 1;

  let query = client
    .from("recipe_likes")
    .select("created_at, recipes:recipe_id!inner(*)", { count: "exact" })
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
      query = query.textSearch("recipes.tsv", search, { type: "websearch", config: "simple" });
    }
    // 필드 선택 검색
    const searchstr = `%${search}%`;
    const tag = escapeArrayValue(search);
    if (params.searchField === "title") {
      query = query.ilike("recipes.title", searchstr);
    }
    if (params.searchField === "writer") {
      query = query.ilike("recipes.writer_name", searchstr);
    }
    if (params.searchField === "tag") {
      query = query.contains("recipes.tags", [search]);
    }
    if (params.searchField === "tag_title") {
      query = query.or(`recipes.title.ilike.${searchstr},recipes.tags.cs.{${tag}}`);
    }
  }

  const { data, error, count } = await query.range(safeOffset, Math.max(rangeEnd, safeOffset));

  throwIfError(error);

  const items = (data ?? []).map((row) => row.recipes).filter((recipe) => Boolean(recipe));
  return {
    items,
    total: count ?? items.length,
  };
}

export async function insertRecipe(
  client: SupabaseClient<Database>,
  parse: RecipeInsertRow
): Promise<RecipeRow> {
  const { data, error } = await client.from("recipes").insert(parse).select("*").single();
  if (error) throw error;
  if (!data) {
    throw new Error("레시피를 생성하지 못했습니다.");
  }
  return data;
}

export async function updateRecipe(
  client: SupabaseClient<Database>,
  id: string,
  payload: RecipeUpdateDB
): Promise<RecipeRow> {
  const { data, error } = await client
    .from("recipes")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  throwIfError(error);
  if (!data) {
    throw new Error("레시피를 수정하지 못했습니다.");
  }
  return data;
}

export async function deleteRecipe(client: SupabaseClient<Database>, id: string): Promise<void> {
  const { error } = await client.from("recipes").delete().eq("id", id);
  throwIfError(error);
}
