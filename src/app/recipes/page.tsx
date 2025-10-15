import RecipeList from "@/features/recipe/ui/RecipeList";
import { listRecipes } from "@/features/recipe/service";
import { getServerSupabase } from "@/lib/supabase/server";
import { buildLikedSet } from "@/features/user_like/service";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const supabase = getServerSupabase();
  const { items } = await listRecipes(supabase, { limit: 50 });

  const ids = items.map(r => r.id);
  const likeset = await buildLikedSet(supabase, ids);
  const initset = Object.fromEntries(ids.map(id => [id, likeset.has(id)]))

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">레시피 목록</h1>
        <p className="text-sm text-foreground/70">
          Supabase RLS 정책으로 보호된 최신 레시피를 실시간으로 확인할 수 있습니다.
        </p>
      </header>
      <RecipeList recipes={items} initset={initset} />
    </main>
  );
}
