import { listCombos } from "@/domain/combo/service";
import { listPosts } from "@/domain/post/service";
import { listRecipes } from "@/domain/recipe/service";
import { parseSearchSort, toContentSorts } from "@/features/search/sort";
import { getServerSupabase } from "@/lib/supabase/server";

import SearchControls from "./section/SearchControls";
import SearchResultCombos from "./section/resultCombos";
import SearchResultPosts from "./section/resultPosts";
import SearchResultRecipe from "./section/resultRecipe";

type SearchParamValue = string | string[] | undefined;
type ViewMode = "grid" | "list";

type Props = {
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

const RECIPE_LIMIT = 4;
const COMBO_LIMIT = 3;
const POST_LIMIT = 4;

function firstValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parsePage(value: SearchParamValue): number {
  const page = Number(firstValue(value));
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseView(value: SearchParamValue): ViewMode {
  return firstValue(value) === "list" ? "list" : "grid";
}

function normalizeQuery(params: Record<string, SearchParamValue>): Record<string, string> {
  const query: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    const nextValue = firstValue(value);
    if (nextValue) query[key] = nextValue;
  }

  return query;
}

export default async function SearchPage(props: Props) {
  const rawSearchParams = (await props.searchParams) ?? {};
  const queryText = firstValue(rawSearchParams.query)?.trim() ?? "";
  const recipePage = parsePage(rawSearchParams.recipePage);
  const comboPage = parsePage(rawSearchParams.comboPage);
  const postPage = parsePage(rawSearchParams.postPage);
  const sort = parseSearchSort(firstValue(rawSearchParams.sort));
  const contentSorts = toContentSorts(sort);
  const viewMode = parseView(rawSearchParams.view);
  const paginationQuery = normalizeQuery(rawSearchParams);
  paginationQuery.sort = sort;
  paginationQuery.view = viewMode;

  const supabase = await getServerSupabase();

  const [recipes, combos, posts] = await Promise.all([
    listRecipes(supabase, {
      limit: RECIPE_LIMIT,
      page: recipePage,
      search: queryText,
      searchField: "tag_title",
      sort: contentSorts.recipe,
    }),
    listCombos(supabase, {
      limit: COMBO_LIMIT,
      page: comboPage,
      search: queryText,
      searchField: "tag_title",
      sort: contentSorts.combo,
    }),
    listPosts(supabase, {
      limit: POST_LIMIT,
      page: postPage,
      search: queryText,
      searchField: "title_contents",
      sort: contentSorts.post,
    }),
  ]);

  const totalCount = recipes.total + combos.total + posts.total;
  const displayQuery = queryText || "전체";

  return (
    <main className="min-h-[calc(100vh-68px)] bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-5 py-10 lg:px-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-end gap-3">
              <h1 className="text-2xl font-black tracking-tight text-zinc-950 md:text-3xl">
                &apos;{displayQuery}&apos; 검색 결과
              </h1>
              <span className="pb-1 text-sm font-black text-[#34783f] md:text-base">
                총 {totalCount.toLocaleString("ko-KR")}건
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-500 md:text-base">
              레시피, 레시피 조합, 커뮤니티에서 &apos;{displayQuery}&apos;에 대한 검색
              결과입니다.
            </p>
          </div>

          <SearchControls initialSort={sort} initialView={viewMode} />
        </header>

        <div className="mt-8 space-y-3">
          <SearchResultRecipe
            recipes={recipes}
            searchParams={paginationQuery}
            queryText={queryText}
            viewMode={viewMode}
          />
          <SearchResultCombos
            combos={combos}
            searchParams={paginationQuery}
            queryText={queryText}
            viewMode={viewMode}
          />
          <SearchResultPosts
            posts={posts}
            searchParams={paginationQuery}
            queryText={queryText}
            viewMode={viewMode}
          />
        </div>
      </div>
    </main>
  );
}
