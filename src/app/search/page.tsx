import { listCombos } from "@/domain/combo/service";
import { listPosts } from "@/domain/post/service";
import { listRecipes } from "@/domain/recipe/service";
import { getServerSupabase } from "@/lib/supabase/server";
import SearchResultCombos from "./section/resultCombos";
import SearchResultPosts from "./section/resultPosts";
import SearchResultRecipe from "./section/resultRecipe";

export default async function SearchPage(searchParams: { query?: string }) {
  const qs = searchParams.query;
  const supabase = getServerSupabase();

  const [recipes, posts, combos] = await Promise.all([
    listRecipes(supabase, { limit: 10, search: qs }),
    listPosts(supabase, { limit: 10, search: qs }),
    listCombos(supabase, { limit: 10, search: qs }),
  ]);

  return (
    <div>
      <section>
        <SearchResultRecipe recipes={recipes} />
      </section>
      <section>
        <SearchResultPosts posts={posts} />
      </section>
      <section>
        <SearchResultCombos combos={combos} />
      </section>
    </div>
  );
}
