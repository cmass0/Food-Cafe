import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeSearchTerm } from "@/lib/domain/repo/querypattern";
import type { FollowFetchParams, FollowListItem, FollowProfile } from "./type";

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
    .order("follower_id", { ascending: true })
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
    .order("following_id", { ascending: true })
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

export async function searchFollowingProfiles(
  client: SupabaseClient<Database>,
  followerId: string,
  rawSearch: string,
  params: FollowFetchParams
): Promise<{ items: FollowProfile[]; total: number }> {
  const search = normalizeSearchTerm(rawSearch);
  if (!search) return { items: [], total: 0 };

  const safeLimit = Math.max(params.limit, 1);
  const safeOffset = Math.max(params.offset, 0);
  const rangeEnd = safeOffset + safeLimit - 1;

  const { data, error, count } = await client
    .from("user_follows")
    .select(`following:profiles!user_follows_following_id_fkey!inner(${PUBLIC_PROFILE_COLUMNS})`, {
      count: "exact",
    })
    .eq("follower_id", followerId)
    .ilike("following.display_name", `%${search}%`)
    .order("following(display_name)", { ascending: true })
    .order("following_id", { ascending: true })
    .range(safeOffset, Math.max(rangeEnd, safeOffset));

  if (error) throw error;
  const items = (data ?? []).flatMap((row) => (row.following ? [row.following] : []));
  return { items, total: count ?? items.length };
}

export async function selectFollowingIds(
  client: SupabaseClient<Database>,
  followerId: string,
  followingIds: string[]
): Promise<string[]> {
  if (followingIds.length === 0) return [];

  const { data, error } = await client
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", followerId)
    .in("following_id", followingIds);

  if (error) throw error;
  return (data ?? []).map((row) => row.following_id);
}
