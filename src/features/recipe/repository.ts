import type { PostgrestError } from "@supabase/supabase-js";

import type {
  FetchRecipesParams,
  RecipeInsertDB,
  RecipeRow,
  RecipeSupabaseClient,
  RecipeUpdateDB,
} from "./types";

//추후 필요하다면 리터럴로 생성성
// const RECIPE_COLUMNS = [
//   "id",
//   "id_text_old",
//   "legacy_id",
//   "title",
//   "summary",
//   "recipe",
//   "image",
//   "images",
//   "category",
//   "tags",
//   "like_count",
//   "view_count",
//   "last_liked_at",
//   "status",
//   "writer_uid",
//   "writer_uid_legacy",
//   "writer_name",
//   "writer_email",
//   "created_at",
//   "updated_at",
// ].join(", ");

function mapRows(rows: RecipeRow[] | null | undefined): RecipeRow[] {
  return Array.isArray(rows) ? (rows as RecipeRow[]) : [];
}

function throwIfError(error: PostgrestError | null): void {
  if (error) throw error;
}




export async function fetchRecipes(
  client: RecipeSupabaseClient,
  params: FetchRecipesParams,
): Promise<RecipeRow[]> {
  const safeLimit = Math.max(params.limit, 1);
  let query = client
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(safeLimit);

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

  if (params.cursor) {
    query = query.or(
      `created_at.lt.${params.cursor.createdAt},and(created_at.eq.${params.cursor.createdAt},id.gt.${params.cursor.id})`
    );
  }

  const { data, error } = await query;
  throwIfError(error);
  return mapRows(data);
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
  throwIfError(error);
  if (!data) {
    throw new Error("레시피를 생성하지 못했습니다.");
  }
  return data as RecipeRow;
}

export async function updateRecipeRecordByOwner(
  client: RecipeSupabaseClient,
  id: string,
  ownerUid: string,
  payload: RecipeUpdateDB
): Promise<RecipeRow> {
  const { data, error } = await client
    .from("recipes")
    .update(payload)
    .eq("id", id)
    .eq("writer_uid", ownerUid)
    .select("*")
    .single();
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
