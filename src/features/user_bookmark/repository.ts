// src/features/user_bookmark/repository.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export async function setRecipeBookmark(
  client: SupabaseClient<Database>,
  params: { userId: string; recipeId: string; bookmark: boolean }
): Promise<void> {
  const { userId, recipeId, bookmark } = params;

  if (bookmark) {
    await client.from("user_bookmarks").delete().eq("user_id", userId).eq("parent_id", recipeId);
    const { error } = await client.from("user_bookmarks").insert({
      user_id: userId,
      parent_id: recipeId,
      parent_type: "recipe",
    });
    if (error) throw error;
  } else {
    const { error } = await client
      .from("user_bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("parent_id", recipeId);
    if (error) throw error;
  }
}

export async function isBookmarked(
  client: SupabaseClient<Database>,
  userId: string,
  recipeId: string
): Promise<boolean> {
  const { count, error } = await client
    .from("user_bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("parent_id", recipeId)
    .limit(1)
  if (error) throw error;
  return (count ?? 0) > 0;
}
