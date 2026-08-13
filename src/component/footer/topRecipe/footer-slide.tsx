import * as trendingService from "@/features/trending/service";
import { getServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import TopCarousel from "../top-recipes-carousel";

export default async function RecipeTopFooterSlide() {
  const supabase = await getServerSupabase();
  const recipes = await trendingService.listTrendingRecipes(supabase, 10).catch((error) => {
    console.error("[footer] 최근 7일 인기 레시피 조회 실패", error);
    return [];
  });

  return (
    <section className="w-full min-w-0 rounded-2xl border-1.5 bg-muted/40 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-baseline justify-between gap-10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">인기 레시피</h2>
          <span className="text-xs text-muted-foreground">최근 7일 TOP 10</span>
        </div>
        <div className="flex items-center justify-end">
          <p className="text-muted-foreground text-sm">
            <Link href="/ranking">더보기 +</Link>
          </p>
        </div>
        <TopCarousel label="최근 7일 인기 레시피" contents={recipes} />
      </div>
    </section>
  );
}
