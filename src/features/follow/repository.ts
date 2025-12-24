import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { FollowFetchParams, FollowingUserRow, FollowUserRow } from "./type";

export async function followerList(
  client: SupabaseClient<Database>,
  userId: string,
  params: FollowFetchParams
): Promise<{ items: FollowUserRow[]; total: number }> {
  const safeLimit = Math.max(params.limit, 1);
  const safeOffset = Math.max(params.offset, 0);
  const rangeEnd = safeOffset + safeLimit - 1;
  const { data, error, count } = await client
    .from("user_follows")
    .select("created_at, follower:users!user_follows_follower_id_fkey(*)", {
      count: "exact",
    })
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .range(safeOffset, Math.max(rangeEnd, safeOffset));

  if (error) throw error;
  const items = (data ?? []).filter((row) => row.follower);
  return { items, total: count ?? items.length };
}

export async function followingList(
  client: SupabaseClient<Database>,
  userId: string,
  params: FollowFetchParams
): Promise<{ items: FollowingUserRow[]; total: number }> {
  const safeLimit = Math.max(params.limit, 1);
  const safeOffset = Math.max(params.offset, 0);
  const rangeEnd = safeOffset + safeLimit - 1;
  const { data, error, count } = await client
    .from("user_follows")
    .select("created_at, following:users!user_follows_following_id_fkey(*)", {
      count: "exact",
    })
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .range(safeOffset, Math.max(rangeEnd, safeOffset));

  if (error) throw error;
  const items = (data ?? []).filter((row) => Boolean(row.following));
  return { items, total: count ?? items.length };
}
