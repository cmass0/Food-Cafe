import Section from "@/components/status/Section";
import {
  parseTrendingPeriod,
  TRENDING_PERIOD_OPTIONS,
  trendingWindowLabel,
  type TrendingPeriod,
} from "@/features/trending/period";
import { loadMyReactions, withMyReactions } from "@/features/my-reactions/service";
import { listCachedTrendingCombos, listCachedTrendingRecipes } from "@/features/trending/cache";
import type { TrendingContentItem } from "@/features/trending/types";
import { loadSection } from "@/lib/errors/section";
import { getServerSupabase } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import Link from "next/link";
import RankingGrid from "./RankingGrid";

export const dynamic = "force-dynamic";

const RANKING_TYPE_OPTIONS = [
  { value: "recipe", label: "레시피", emptySubject: "레시피가" },
  { value: "combo", label: "레시피 조합", emptySubject: "레시피 조합이" },
] as const;

type RankingType = (typeof RANKING_TYPE_OPTIONS)[number]["value"];

type RankingPageProps = {
  searchParams: Promise<{
    period?: string | string[];
    type?: string | string[];
  }>;
};

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isRankingType(value: string | undefined): value is RankingType {
  return RANKING_TYPE_OPTIONS.some((option) => option.value === value);
}

function parseRankingType(value: string | undefined): RankingType {
  return isRankingType(value) ? value : "recipe";
}

async function getRankingItems(period: TrendingPeriod, rankingType: RankingType) {
  const supabase = await getServerSupabase();

  const items =
    rankingType === "combo"
      ? await listCachedTrendingCombos(50, period)
      : await listCachedTrendingRecipes(50, period);

  // 인기 집계에는 사용자 정보가 없어 내가 누른 좋아요·북마크를 따로 붙인다.
  const reactions = await loadMyReactions(
    supabase,
    items.map(({ resourceType, id }) => ({ type: resourceType, id }))
  );
  return withMyReactions(items, (item) => item.resourceType, reactions);
}

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const params = await searchParams;
  const period = parseTrendingPeriod(firstSearchParam(params.period));
  const rankingType = parseRankingType(firstSearchParam(params.type));
  const typeOption =
    RANKING_TYPE_OPTIONS.find((option) => option.value === rankingType) ?? RANKING_TYPE_OPTIONS[0];
  const windowLabel = trendingWindowLabel(period);
  const rankingResult = await loadSection<TrendingContentItem[]>(
    "ranking.items",
    () => getRankingItems(period, rankingType),
    []
  );

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{windowLabel} TOP 50</h1>
        <p className="text-sm text-muted-foreground">
          좋아요·북마크·댓글과 고유 참여자를 반영한 인기 목록입니다.
        </p>
      </header>

      <nav aria-label="랭킹 기간" className="flex justify-center">
        <div className="inline-flex rounded-lg bg-muted p-1">
          {TRENDING_PERIOD_OPTIONS.map((option) => {
            const isCurrent = option.value === period;

            return (
              <Link
                key={option.value}
                href={{ pathname: "/ranking", query: { period: option.value, type: rankingType } }}
                aria-current={isCurrent ? "page" : undefined}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <section className="space-y-4">
        <nav aria-label="랭킹 종류" className="flex justify-center">
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
            {RANKING_TYPE_OPTIONS.map((option) => {
              const isCurrent = option.value === rankingType;

              return (
                <Link
                  key={option.value}
                  href={{ pathname: "/ranking", query: { period, type: option.value } }}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isCurrent ? "bg-background text-foreground shadow" : "hover:text-foreground"
                  )}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div>
          <Section
            name="ranking.items"
            failed={rankingResult.error}
            title="랭킹을 표시하지 못했습니다."
            resetKeys={[period, rankingType]}
          >
            <RankingGrid
              items={rankingResult.data}
              emptyMessage={`${windowLabel} 동안 참여가 발생한 ${typeOption.emptySubject} 없습니다.`}
            />
          </Section>
        </div>
      </section>
    </main>
  );
}
