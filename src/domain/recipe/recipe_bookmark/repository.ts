import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function isBookmarkedRecipe(
  client: SupabaseClient<Database>,
  userId: string,
  recipeId: string
): Promise<boolean> {
  const { data, error } = await client
    .from("recipe_bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("parent_id", recipeId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

// 포함 여부를 빠르게 처리하기 위해 set
export async function fetchBookmarkedRecipeIds(
  client: SupabaseClient<Database>,
  userId: string,
  recipeIds: string[]
): Promise<Set<string>> {
  if (!userId || recipeIds.length === 0) return new Set();
  const { data, error } = await client
    .from("recipe_bookmarks")
    .select("parent_id")
    .eq("user_id", userId)
    .in("parent_id", recipeIds);
  if (error) throw error;
  return new Set((data ?? []).map((d) => d.parent_id));
}


