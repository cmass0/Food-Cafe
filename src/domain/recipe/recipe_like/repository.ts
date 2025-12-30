import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

export async function fetchLikedRecipeIds(
  client: SupabaseClient<Database>,
  userId: string,
  recipeIds: string[]
): Promise<Set<string>> {
  if (!userId || recipeIds.length === 0) return new Set();
  const { data, error } = await client
    .from("recipe_likes")
    .select("recipe_id")
    .eq("user_id", userId)
    .in("recipe_id", recipeIds);
  if (error) throw error;
  return new Set((data ?? []).map((data) => data.recipe_id));
}

export async function isLikedRecipe(
  client: SupabaseClient<Database>,
  recipeId: string,
  userId: string
): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await client
    .from("recipe_likes")
    .select("recipe_id")
    .eq("user_id", userId)
    .eq("recipe_id", recipeId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function countLikesRecipe(
  client: SupabaseClient<Database>,
  recipeId: string
): Promise<number> {
  const { count, error } = await client
    .from("recipe_likes")
    .select("*", { count: "exact", head: true })
    .eq("recipe_id", recipeId);

  if (error) throw error;
  return count ?? 0;
}
