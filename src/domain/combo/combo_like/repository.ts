import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

export async function fetchLikedCombos(
  client: SupabaseClient<Database>,
  userId: string,
  comboIds: string[]
): Promise<Set<string>> {
  if (!userId || comboIds.length === 0) return new Set<string>();

  const { data, error } = await client
    .from("combo_likes")
    .select("combo_id")
    .eq("user_id", userId)
    .in("combo_id", comboIds);

  if (error) throw error;
  return new Set((data ?? []).map((data) => data.combo_id));
}

export async function isLikedCombo(
  client: SupabaseClient<Database>,
  comboid: string,
  userId: string
): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await client
    .from("combo_likes")
    .select("combo_id")
    .eq("user_id", userId)
    .eq("combo_id", comboid)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function countLikesCombo(
  client: SupabaseClient<Database>,
  comboId: string
): Promise<number> {
  const { count, error } = await client
    .from("combo_likes")
    .select("*", { count: "exact", head: true })
    .eq("combo_id", comboId);

  if (error) throw error;
  return count ?? 0;
}
