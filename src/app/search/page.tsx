import { listCombos } from "@/domain/combo/service";
import { listPosts } from "@/domain/post/service";
import { listRecipes } from "@/domain/recipe/service";
import { getServerSupabase } from "@/lib/supabase/server";
import SearchResultCombos from "./section/resultCombos";
import SearchResultPosts from "./section/resultPosts";
import SearchResultRecipe from "./section/resultRecipe";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function SearchPage(props: Props) {
  const searchParams = await props.searchParams;
  const search = searchParams.query as string;

  const supabase = await getServerSupabase();
  const recipePage = Number(searchParams.recipePage) || 1;
  const comboPage = Number(searchParams.comboPage) || 1;
  const postPage = Number(searchParams.postPage) || 1;

  const [recipes, posts, combos] = await Promise.all([
    listRecipes(supabase, { limit: 6, search, page: recipePage }),
    listPosts(supabase, { limit: 6, search, page: postPage }),
    listCombos(supabase, { limit: 6, search, page: comboPage }),
  ]);

  return (
    <div className="py-10 px-4 max-w-4xl mx-auto space-y-6">
      <section>
        <SearchResultRecipe recipes={recipes} searchParams={searchParams} />
      </section>
      <section>
        <SearchResultCombos combos={combos} searchParams={searchParams} />
      </section>
      <section>
        <SearchResultPosts posts={posts} searchParams={searchParams} />
      </section>
    </div>
  );
}
