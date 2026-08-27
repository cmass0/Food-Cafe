import "server-only";

import { resolveLimit, resolveOffset } from "@/lib/pagination";
import { resolveStorageImageUrl } from "@/lib/storage/paths";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as repository from "./repository";
import type { FollowListOptions, FollowListResult, MentionCandidateResult } from "./type";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function resolveFollowProfileImage<T extends { photo_url: string | null }>(profile: T): T {
  return {
    ...profile,
    photo_url: resolveStorageImageUrl(profile.photo_url),
  };
}

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

  const { items: rows, total: rawTotal } = await repository.followerList(client, userId, {
    limit,
    offset,
  });
  const items = rows.map((item) => ({
    ...item,
    user: resolveFollowProfileImage(item.user),
  }));
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

  const { items: rows, total: rawTotal } = await repository.followingList(client, userId, {
    limit,
    offset,
  });
  const items = rows.map((item) => ({
    ...item,
    user: resolveFollowProfileImage(item.user),
  }));
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

export async function searchMentionCandidates(
  client: SupabaseClient<Database>,
  followerId: string,
  search: string,
  options?: FollowListOptions
): Promise<MentionCandidateResult> {
  const limit = resolveLimit(options?.limit, 10, 10);
  const offset = resolveOffset(options?.page, limit);
  if (!followerId) {
    return { items: [], total: 0, limit, offset, hasMore: false };
  }

  const { items: rows, total: rawTotal } = await repository.searchFollowingProfiles(
    client,
    followerId,
    search,
    { limit, offset }
  );
  const items = rows.map(resolveFollowProfileImage);
  const total = Math.max(rawTotal, offset + items.length);
  return {
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total,
  };
}

export async function assertMentionTargetsAreFollowed(
  client: SupabaseClient<Database>,
  followerId: string,
  targetIds: string[]
): Promise<void> {
  const uniqueTargetIds = [...new Set(targetIds)];
  if (uniqueTargetIds.length === 0) return;

  const followedIds = await repository.selectFollowingIds(client, followerId, uniqueTargetIds);
  if (followedIds.length !== uniqueTargetIds.length) {
    throw new Error("팔로잉 중인 사용자만 멘션할 수 있습니다.");
  }
}
