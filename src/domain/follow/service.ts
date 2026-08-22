import "server-only";

import { resolveLimit, resolveOffset } from "@/lib/pagination";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as repository from "./repository";
import type { FollowListOptions, FollowListResult } from "./type";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function listFollowers(
  client: SupabaseClient<Database>,
  userId: string,
  options?: FollowListOptions
): Promise<FollowListResult> {
  const limit = resolveLimit(options?.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = resolveOffset(options?.page, limit);
  if (!userId) {
    return { items: [], total: 0, limit, offset, hasMore: false };
  }

  const { items, total: rawTotal } = await repository.followerList(client, userId, {
    limit,
    offset,
  });
  const total = Math.max(rawTotal, offset + items.length);
  const hasMore = offset + items.length < total;

  return {
    items,
    total,
    limit,
    offset,
    hasMore,
  };
}

export async function listFollowings(
  client: SupabaseClient<Database>,
  userId: string,
  options?: FollowListOptions
): Promise<FollowListResult> {
  const limit = resolveLimit(options?.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = resolveOffset(options?.page, limit);
  if (!userId) {
    return { items: [], total: 0, limit, offset, hasMore: false };
  }

  const { items, total: rawTotal } = await repository.followingList(client, userId, {
    limit,
    offset,
  });
  const total = Math.max(rawTotal, offset + items.length);
  const hasMore = offset + items.length < total;

  return {
    items,
    total,
    limit,
    offset,
    hasMore,
  };
}

export async function checkIsFollowing(
  client: SupabaseClient<Database>,
  followerId: string,
  followingId: string
): Promise<boolean> {
  if (!followerId || !followingId || followerId === followingId) return false;
  return repository.isFollowing(client, followerId, followingId);
}
