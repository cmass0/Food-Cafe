import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

export async function isBookmarked(
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

export async function fetchBookmarkedComboIds(
  client: SupabaseClient<Database>,
  userId: string,
  comboIds: string[]
): Promise<Set<string>> {
  if (!userId || comboIds.length === 0) return new Set<string>();
  const { data, error } = await client
    .from("combo_bookmarks")
    .select("combo_id")
    .eq("user_id", userId)
    .in("combo_id", comboIds);
  if (error) throw error;
  return new Set((data ?? []).map((d) => d.combo_id));
}

export async function toggleComboBookmark(client: SupabaseClient<Database>, id: string) {
  return client.rpc("toggle_bookmark", {
    p_type: "combo",
    p_id: id,
  });
}
