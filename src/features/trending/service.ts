import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";
import { DEFAULT_TRENDING_PERIOD, type TrendingPeriod } from "./period";
import * as repository from "./repository";
import type {
  TrendingComboRow,
  TrendingContentItem,
  TrendingPostRow,
  TrendingRecipeRow,
  TrendingRecipeTag,
  TrendingResourceType,
  TrendingTagRow,
} from "./types";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

type TrendingContentRow = TrendingRecipeRow | TrendingComboRow | TrendingPostRow;

function resolveLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(Math.floor(limit ?? DEFAULT_LIMIT), MAX_LIMIT));
}

function mapContentRow(
  row: TrendingContentRow,
  resourceType: TrendingResourceType
): TrendingContentItem {
  return {
    resourceType,
    id: row.id,
    title: row.title,
    summary: row.summary ?? null,
    image: row.image ?? null,
    tags: row.tags ?? [],
    likeCount: row.like_count,
    bookmarkCount: row.bookmark_count,
    commentCount: row.comment_count,
    viewCount: row.view_count,
    createdAt: row.created_at,
    writerUid: row.writer_uid ?? null,
    writerName: row.writer_name ?? null,
    recentLikeCount: row.recent_like_count,
    recentBookmarkCount: row.recent_bookmark_count,
    recentCommentCount: row.recent_comment_count,
    recentParticipantCount: row.recent_participant_count,
    recentActivityCount: row.recent_activity_count,
    trendScore: row.trend_score,
    lastActivityAt: row.last_activity_at,
  };
}

function mapTagRow(row: TrendingTagRow): TrendingRecipeTag {
  return {
    tag: row.tag,
    recentRecipeCount: row.recent_recipe_count,
    totalRecipeCount: row.total_recipe_count,
    recentLikeCount: row.recent_like_count,
    recentBookmarkCount: row.recent_bookmark_count,
    recentCommentCount: row.recent_comment_count,
    recentParticipantCount: row.recent_participant_count,
    recentActivityCount: row.recent_activity_count,
    trendScore: row.trend_score,
    lastActivityAt: row.last_activity_at,
  };
}

export function sortTrendingItems(items: TrendingContentItem[]): TrendingContentItem[] {
  return [...items].sort((a, b) => {
    if (a.trendScore !== b.trendScore) return b.trendScore - a.trendScore;
    if (a.recentParticipantCount !== b.recentParticipantCount) {
      return b.recentParticipantCount - a.recentParticipantCount;
    }
    if (a.recentBookmarkCount !== b.recentBookmarkCount) {
      return b.recentBookmarkCount - a.recentBookmarkCount;
    }
    return a.id.localeCompare(b.id);
  });
}

export async function listTrendingRecipes(
  client: SupabaseClient<Database>,
  limit?: number,
  period: TrendingPeriod = DEFAULT_TRENDING_PERIOD
): Promise<TrendingContentItem[]> {
  const rows = await repository.selectTrendingRecipes(client, resolveLimit(limit), period);
  return sortTrendingItems(rows.map((row) => mapContentRow(row, "recipe")));
}

export async function listTrendingCombos(
  client: SupabaseClient<Database>,
  limit?: number,
  period: TrendingPeriod = DEFAULT_TRENDING_PERIOD
): Promise<TrendingContentItem[]> {
  const rows = await repository.selectTrendingCombos(client, resolveLimit(limit), period);
  return sortTrendingItems(rows.map((row) => mapContentRow(row, "combo")));
}

export async function listTrendingPosts(
  client: SupabaseClient<Database>,
  limit?: number,
  period: TrendingPeriod = DEFAULT_TRENDING_PERIOD
): Promise<TrendingContentItem[]> {
  const rows = await repository.selectTrendingPosts(client, resolveLimit(limit), period);
  return sortTrendingItems(rows.map((row) => mapContentRow(row, "post")));
}

export async function listTrendingRecipeTags(
  client: SupabaseClient<Database>,
  limit?: number,
  period: TrendingPeriod = DEFAULT_TRENDING_PERIOD
): Promise<TrendingRecipeTag[]> {
  const rows = await repository.selectTrendingRecipeTags(client, resolveLimit(limit), period);
  return rows.map(mapTagRow);
}
