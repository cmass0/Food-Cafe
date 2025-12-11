// src/features/user_like/repository.ts
import { getServerSupabase } from "@/lib/supabase/server";
import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";




export async function fetchLikedRecipeIds(
  client: SupabaseClient<Database>,
  userId: string,
  recipeIds: string[],
): Promise<Set<string>> {
  if (!userId || recipeIds.length === 0) return new Set();
  const { data, error } = await client
    .from("user_likes")
    .select("recipe_id")
    .eq("user_id", userId)
    .in("recipe_id", recipeIds);
  if (error) throw error;
  return new Set((data ?? []).map((d: { recipe_id: string; }) => d.recipe_id as string));
}



export async function isLiked(recipeId: string, userId: string): Promise<boolean> {
  const supabase = getServerSupabase();
  if (!userId) return false;

  const { data, error } = await supabase
    .from("user_likes")
    .select("recipe_id", { head: false, count: "exact" })
    .eq("user_id", userId)
    .eq("recipe_id", recipeId)
    .limit(1);

  if (error) throw error;
  return !!(data && data.length > 0);
}

export async function countLikes(recipeId: string): Promise<number> {
  const supabase = getServerSupabase();
  const { count, error } = await supabase
    .from("user_likes")
    .select("*", { count: "exact", head: true })
    .eq("recipe_id", recipeId);

  if (error) throw error;
  return count ?? 0;
}


export async function setRecipeLike(
  client: SupabaseClient<Database>,
  params: { userId: string; recipeId: string; like: boolean }
): Promise<void> {
  const { userId, recipeId, like } = params;

  if (like) {
    // 좋아요 추가 중복은 무시
    const { error } = await client
      .from("user_likes")
      .upsert(
        { user_id: userId, recipe_id: recipeId },
        { onConflict: "user_id,recipe_id", ignoreDuplicates: true }
      );

    if (error) throw error;
  } else {
    // 좋아요 취소
    const { error } = await client
      .from("user_likes")
      .delete()
      .eq("user_id", userId)
      .eq("recipe_id", recipeId);

    if (error) throw error;
  }
}
