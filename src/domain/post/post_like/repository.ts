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

// 목록에서 사용자가 좋아요한 글만 한 번에 고른다.
export async function fetchLikedPostIds(
  client: SupabaseClient<Database>,
  userId: string,
  postIds: string[]
): Promise<Set<string>> {
  if (!userId || postIds.length === 0) return new Set();
  const { data, error } = await client
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.post_id));
}
