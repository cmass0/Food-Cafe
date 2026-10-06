import "server-only";

import { createMemoryCache } from "@/lib/cache/memory-cache";
import { processSingleton } from "@/lib/process-singleton";
import { getPublicSupabase } from "@/lib/supabase/public";
import { DEFAULT_TRENDING_PERIOD, type TrendingPeriod } from "./period";
import * as service from "./service";
import type { TrendingContentItem, TrendingRecipeTag } from "./types";

// 인기 집계는 누가 요청해도 결과가 같다(집계 함수가 로그인 사용자를 보지 않는다). 그래서 60초 동안 서버 메모리에
// 들고 모든 요청이 같이 쓴다. 부하 테스트에서 집계 4종이 DB 시간의 71%를 차지해서 붙였다.
// - 집계는 로그인 정보 없는 클라이언트로 묻는다. 요청한 사람의 권한이 결과에 섞이면 다른 사람에게도 보이기 때문이다.
// - "내가 누른 좋아요"처럼 사람마다 다른 값은 여기 넣지 않고 화면에서 따로 붙인다.
// - 이름표는 종류·개수·기간으로 만든다. 하나라도 빠지면 다른 목록이 섞여 보인다.
// - 페이지와 API 라우트가 같은 캐시를 써야 API에서 삭제할 때도 비워지므로 프로세스에 하나만 둔다.
const trendingCache = processSingleton("trending-cache", () =>
  createMemoryCache<TrendingContentItem[] | TrendingRecipeTag[]>({ ttlMs: 60_000, max: 100 })
);

export function listCachedTrendingRecipes(
  limit: number,
  period: TrendingPeriod = DEFAULT_TRENDING_PERIOD
): Promise<TrendingContentItem[]> {
  return trendingCache.get(`recipe:${limit}:${period}`, () =>
    service.listTrendingRecipes(getPublicSupabase(), limit, period)
  );
}

export function listCachedTrendingCombos(
  limit: number,
  period: TrendingPeriod = DEFAULT_TRENDING_PERIOD
): Promise<TrendingContentItem[]> {
  return trendingCache.get(`combo:${limit}:${period}`, () =>
    service.listTrendingCombos(getPublicSupabase(), limit, period)
  );
}

export function listCachedTrendingPosts(
  limit: number,
  period: TrendingPeriod = DEFAULT_TRENDING_PERIOD
): Promise<TrendingContentItem[]> {
  return trendingCache.get(`post:${limit}:${period}`, () =>
    service.listTrendingPosts(getPublicSupabase(), limit, period)
  );
}

export function listCachedTrendingRecipeTags(
  limit: number,
  period: TrendingPeriod = DEFAULT_TRENDING_PERIOD
): Promise<TrendingRecipeTag[]> {
  return trendingCache.get(`recipe-tag:${limit}:${period}`, () =>
    service.listTrendingRecipeTags(getPublicSupabase(), limit, period)
  );
}

/** 레시피·조합·게시글을 삭제한 뒤 부른다. 삭제된 글이 최대 60초 동안 인기 목록에 남지 않게 한다. */
export function clearTrendingCache(): void {
  trendingCache.clear();
}
