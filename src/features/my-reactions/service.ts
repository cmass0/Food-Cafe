import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchBookmarkedComboIds } from "@/domain/combo/combo_bookmark/repository";
import { fetchLikedCombos } from "@/domain/combo/combo_like/repository";
import { fetchBookmarkedPostIds } from "@/domain/post/post_bookmark/repository";
import { fetchLikedPostIds } from "@/domain/post/post_like/repository";
import { fetchBookmarkedRecipeIds } from "@/domain/recipe/recipe_bookmark/repository";
import { fetchLikedRecipeIds } from "@/domain/recipe/recipe_like/repository";
import type { Database } from "@/types/supabase";

// 카드 목록에 "내가 누른 좋아요·북마크"를 표시하기 위한 조회. 레시피·조합·게시글이 섞인 목록(인기 집계 등)도
// 한 번에 처리한다. 레시피·조합 목록 서비스는 이 값을 직접 계산하므로, 그 밖의 목록에서 쓴다.

export type ReactionTargetType = "recipe" | "combo" | "post";

export type ReactionTarget = { type: ReactionTargetType; id: string };

export type MyReactions = {
  liked: ReadonlySet<string>;
  bookmarked: ReadonlySet<string>;
};

export const NO_REACTIONS: MyReactions = { liked: new Set(), bookmarked: new Set() };

type IdsFetcher = (
  client: SupabaseClient<Database>,
  userId: string,
  ids: string[]
) => Promise<Set<string>>;

const FETCHERS: Record<ReactionTargetType, { liked: IdsFetcher; bookmarked: IdsFetcher }> = {
  recipe: { liked: fetchLikedRecipeIds, bookmarked: fetchBookmarkedRecipeIds },
  combo: { liked: fetchLikedCombos, bookmarked: fetchBookmarkedComboIds },
  post: { liked: fetchLikedPostIds, bookmarked: fetchBookmarkedPostIds },
};

function reactionKey(type: ReactionTargetType, id: string): string {
  return `${type}:${id}`;
}

/**
 * 로그인 사용자가 대상들에 누른 좋아요·북마크를 조회한다. 비로그인이거나 대상이 없으면 조회하지 않는다.
 * userId를 이미 알면 넘겨서 로그인 확인 요청을 아낀다(null은 비로그인).
 * 카드의 꾸밈 정보라 조회가 실패해도 페이지를 깨뜨리지 않고, 기록만 남긴 뒤 빈 결과를 돌려준다.
 */
export async function loadMyReactions(
  client: SupabaseClient<Database>,
  targets: ReactionTarget[],
  userId?: string | null
): Promise<MyReactions> {
  if (targets.length === 0) return NO_REACTIONS;

  const resolvedUserId =
    userId === undefined ? ((await client.auth.getUser()).data.user?.id ?? null) : userId;
  if (!resolvedUserId) return NO_REACTIONS;

  const idsByType = new Map<ReactionTargetType, Set<string>>();
  for (const { type, id } of targets) {
    const ids = idsByType.get(type) ?? new Set<string>();
    ids.add(id);
    idsByType.set(type, ids);
  }

  const liked = new Set<string>();
  const bookmarked = new Set<string>();
  try {
    await Promise.all(
      Array.from(idsByType, async ([type, idSet]) => {
        const ids = Array.from(idSet);
        const [likedIds, bookmarkedIds] = await Promise.all([
          FETCHERS[type].liked(client, resolvedUserId, ids),
          FETCHERS[type].bookmarked(client, resolvedUserId, ids),
        ]);
        for (const id of likedIds) liked.add(reactionKey(type, id));
        for (const id of bookmarkedIds) bookmarked.add(reactionKey(type, id));
      })
    );
  } catch (error) {
    console.error("내 좋아요·북마크를 불러오지 못했습니다.", error);
    return NO_REACTIONS;
  }

  return { liked, bookmarked };
}

/** 목록 항목마다 liked·bookmarked를 붙인다. */
export function withMyReactions<T extends { id: string }>(
  items: T[],
  type: ReactionTargetType | ((item: T) => ReactionTargetType),
  reactions: MyReactions
): (T & { liked: boolean; bookmarked: boolean })[] {
  return items.map((item) => {
    const key = reactionKey(typeof type === "function" ? type(item) : type, item.id);
    return { ...item, liked: reactions.liked.has(key), bookmarked: reactions.bookmarked.has(key) };
  });
}
