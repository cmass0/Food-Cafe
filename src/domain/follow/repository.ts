import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { FollowFetchParams, FollowListItem } from "./type";

const PUBLIC_PROFILE_COLUMNS = "id, display_name, photo_url";

export async function followerList(
  client: SupabaseClient<Database>,
  userId: string,
  params: FollowFetchParams
): Promise<{ items: FollowListItem[]; total: number }> {
  const safeLimit = Math.max(params.limit, 1);
  const safeOffset = Math.max(params.offset, 0);
  const rangeEnd = safeOffset + safeLimit - 1;
  const { data, error, count } = await client
    .from("user_follows")
    .select(
      `created_at, follower:profiles!user_follows_follower_id_fkey(${PUBLIC_PROFILE_COLUMNS})`,
      { count: "exact" }
    )
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .range(safeOffset, Math.max(rangeEnd, safeOffset));

  if (error) throw error;
  const items = (data ?? []).flatMap((row) =>
    row.follower ? [{ followedAt: row.created_at, user: row.follower }] : []
  );
  return { items, total: count ?? items.length };
}

export async function followingList(
  client: SupabaseClient<Database>,
  userId: string,
  params: FollowFetchParams
): Promise<{ items: FollowListItem[]; total: number }> {
  const safeLimit = Math.max(params.limit, 1);
  const safeOffset = Math.max(params.offset, 0);
  const rangeEnd = safeOffset + safeLimit - 1;
  const { data, error, count } = await client
    .from("user_follows")
    .select(
      `created_at, following:profiles!user_follows_following_id_fkey(${PUBLIC_PROFILE_COLUMNS})`,
      { count: "exact" }
    )
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .range(safeOffset, Math.max(rangeEnd, safeOffset));

  if (error) throw error;
  const items = (data ?? []).flatMap((row) =>
    row.following ? [{ followedAt: row.created_at, user: row.following }] : []
  );
  return { items, total: count ?? items.length };
}

export async function isFollowing(
  client: SupabaseClient<Database>,
  followerId: string,
  followingId: string
): Promise<boolean> {
  const { data, error } = await client
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
