import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

export async function isLikedPost(
  client: SupabaseClient<Database>,
  postId: string,
  userId: string
): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await client
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
