// src/features/user_bookmark/repository.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export async function setRecipeBookmark(
  client: SupabaseClient<Database>,
  params: { userId: string; recipeId: string; bookmark: boolean }
): Promise<void> {
  const { userId, recipeId, bookmark } = params;

  if (bookmark) {
    const { error } = await client.from("user_bookmarks").upsert(
      {
        user_id: userId,
        parent_id: recipeId,
      },
      { onConflict: "user_id,parent_id" }
    );
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
  const { data, error } = await client
    .from("user_bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("parent_id", recipeId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function fetchBookmarkedRecipeIds(
  client: SupabaseClient<Database>,
  userId: string,
  recipeIds: string[]
): Promise<Set<string>> {
  if (!userId || recipeIds.length === 0) return new Set();
  const { data, error } = await client
    .from("user_bookmarks")
    .select("parent_id")
    .eq("user_id", userId)
    .in("parent_id", recipeIds);
  if (error) throw error;
  return new Set((data ?? []).map((d: { parent_id: string }) => d.parent_id));
}
