import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as trendingService from "@/features/trending/service";
import { getServerSupabase } from "@/lib/supabase/server";
import RankingGrid from "./RankingGrid";

export const dynamic = "force-dynamic";

async function getRankingData() {
  const supabase = await getServerSupabase();

  try {
    const [recipes, combos] = await Promise.all([
      trendingService.listTrendingRecipes(supabase, 50),
      trendingService.listTrendingCombos(supabase, 50),
    ]);

    return { recipes, combos };
  } catch (error) {
    console.error("[ranking] 최근 7일 랭킹 조회 실패", error);
    return { recipes: [], combos: [] };
  }
}

export default async function RankingPage() {
  const { recipes, combos } = await getRankingData();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">최근 7일 TOP 50</h1>
        <p className="text-sm text-muted-foreground">
          좋아요·북마크·댓글과 고유 참여자를 반영한 인기 목록입니다.
        </p>
      </header>

      <Tabs defaultValue="recipe" className="w-full">
        <div className="flex items-center justify-center">
          <TabsList className="mb-4">
            <TabsTrigger value="recipe">레시피</TabsTrigger>
            <TabsTrigger value="combo">레시피 조합</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="recipe">
          <RankingGrid items={recipes} />
        </TabsContent>

        <TabsContent value="combo">
          <RankingGrid items={combos} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
