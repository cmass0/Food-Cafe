import type { Database } from "@/types/supabase";

export type TrendingResourceType = "recipe" | "combo" | "post";

export type TrendingRecipeRow =
  Database["public"]["Functions"]["get_trending_recipes"]["Returns"][number];
export type TrendingComboRow =
  Database["public"]["Functions"]["get_trending_combos"]["Returns"][number];
export type TrendingPostRow =
  Database["public"]["Functions"]["get_trending_posts"]["Returns"][number];
export type TrendingTagRow =
  Database["public"]["Functions"]["get_trending_recipe_tags"]["Returns"][number];

export interface TrendingContentItem {
  resourceType: TrendingResourceType;
  id: string;
  title: string;
  summary: string | null;
  image: string | null;
  tags: string[];
  likeCount: number;
  bookmarkCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  writerUid: string | null;
  writerName: string | null;
  recentLikeCount: number;
  recentBookmarkCount: number;
  recentCommentCount: number;
  recentParticipantCount: number;
  recentActivityCount: number;
  trendScore: number;
  lastActivityAt: string;
  // 화면에서 로그인 사용자가 누른 좋아요·북마크인지 붙인 값(features/my-reactions). 집계 결과에는 없다.
  liked?: boolean;
  bookmarked?: boolean;
}

export interface TrendingRecipeTag {
  tag: string;
  recentRecipeCount: number;
  totalRecipeCount: number;
  recentLikeCount: number;
  recentBookmarkCount: number;
  recentCommentCount: number;
  recentParticipantCount: number;
  recentActivityCount: number;
  trendScore: number;
  lastActivityAt: string;
}
