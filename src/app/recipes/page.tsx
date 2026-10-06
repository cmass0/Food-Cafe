import { SearchX } from "lucide-react";

import { PaginationComponent } from "@/components/Pagination";
import Section from "@/components/status/Section";
import { getRecipeCategoryLabel, isRecipeCategoryKey } from "@/domain/recipe/category";
import {
  DEFAULT_RECIPE_LIST_LIMIT,
  parseRecipeListLimit,
  parseRecipeListPage,
  parseRecipeSearchField,
  parseRecipeSort,
  toRecipeListQuery,
} from "@/domain/recipe/list-params";
import * as recipeService from "@/domain/recipe/service";
import type { Recipe, RecipeListResult } from "@/domain/recipe/types";
import { loadSection } from "@/lib/errors/section";
import { getServerSupabase } from "@/lib/supabase/server";

import RecipeCategoryChips from "./ui/RecipeCategoryChips";
import RecipeListCard from "./ui/RecipeListCard";
import RecipesToolbar from "./ui/RecipesToolbar";
import ShareRecipeButton from "./ui/ShareRecipeButton";

type SearchParamValue = string | string[] | undefined;

type RecipesPageProps = {
  searchParams?: Promise<{
    page?: SearchParamValue;
    limit?: SearchParamValue;
    search?: SearchParamValue;
    searchField?: SearchParamValue;
    category?: SearchParamValue;
    sort?: SearchParamValue;
  }>;
};

function firstValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function RecipesGrid({ recipes }: { recipes: Recipe[] }) {
  if (!recipes.length) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-[#fbfaf7] px-6 py-20 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#7c9a80] ring-1 ring-zinc-200">
          <SearchX className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-semibold text-zinc-800">조건에 맞는 레시피가 없습니다.</p>
        <p className="mt-1.5 text-sm text-zinc-500">검색어를 바꾸거나 새 레시피를 공유해보세요.</p>
      </div>
    );
  }

  // 사진이 있는 첫 카드만 미리 받는다. 모바일 첫 화면에도 첫 줄 카드 정도만 보인다.
  // 더 미리 받으면 사진끼리 회선을 나눠 첫 사진이 늦어지고, 첫 카드에 사진이 없으면 인덱스 0은 효과가 없다.
  const preloadIndex = recipes.findIndex((recipe) => recipe.image);

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
      {recipes.map((recipe, index) => (
        <RecipeListCard key={recipe.id} recipe={recipe} preload={index === preloadIndex} />
      ))}
    </div>
  );
}

// 목록은 서버에서 조회해 HTML에 담아 보낸다. 브라우저가 JS를 실행한 뒤에야 목록을 요청하면
// 느린 회선에서 카드 이미지 요청이 몇 초씩 늦어진다. 정렬·검색·페이지 조건은 모두 주소로 받는다.
export default async function RecipesPage(props: RecipesPageProps) {
  const searchParams = await props.searchParams;
  const page = parseRecipeListPage(firstValue(searchParams?.page)) ?? 1;
  const limit = parseRecipeListLimit(firstValue(searchParams?.limit)) ?? DEFAULT_RECIPE_LIST_LIMIT;
  const searchQuery = firstValue(searchParams?.search)?.trim() || undefined;
  const searchField = parseRecipeSearchField(firstValue(searchParams?.searchField)) ?? "title";
  const categoryParam = firstValue(searchParams?.category);
  const category = isRecipeCategoryKey(categoryParam) ? categoryParam : undefined;
  const categoryLabel = category ? getRecipeCategoryLabel(category) : undefined;
  const sort = parseRecipeSort(firstValue(searchParams?.sort)) ?? "recent";

  const supabase = await getServerSupabase();
  const emptyList: RecipeListResult = {
    items: [],
    total: 0,
    limit,
    offset: (page - 1) * limit,
    hasMore: false,
  };
  const listResult = await loadSection(
    "recipes.list",
    () =>
      recipeService.listRecipes(supabase, {
        page,
        limit,
        sort,
        category,
        ...(searchQuery ? { search: searchQuery, searchField } : {}),
      }),
    emptyList
  );
  // 서비스가 상한을 적용한 실제 페이지 크기로 페이지 번호를 계산한다.
  const { items, total, limit: pageSize } = listResult.data;

  const paginationQuery = toRecipeListQuery({
    sort,
    category,
    search: searchQuery,
    searchField,
    limit: pageSize,
  });

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <section className="border-b border-zinc-100 bg-[#fbfaf7]">
        <div className="mx-auto w-full max-w-7xl px-5 pb-6 pt-10 md:pt-12 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3f914b]">Recipes</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">
                {categoryLabel ? `${categoryLabel} 레시피` : "레시피"}
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                다양한 레시피를 찾아보고, 나만의 레시피도 공유해보세요!
              </p>
            </div>
            <ShareRecipeButton />
          </div>

          <RecipeCategoryChips
            className="mt-8"
            category={category}
            sort={sort}
            search={searchQuery}
            searchField={searchField}
            limit={pageSize}
          />
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-8">
        <RecipesToolbar
          sort={sort}
          category={category}
          searchQuery={searchQuery}
          searchField={searchField}
          limit={pageSize}
          total={listResult.error ? undefined : total}
        />

        <div className="mt-8">
          <Section
            name="recipes.list"
            failed={listResult.error}
            outOfRange={listResult.outOfRange}
            title="레시피 목록을 표시하지 못했습니다."
            resetKeys={[page, limit, searchQuery, searchField, sort, category]}
          >
            <RecipesGrid recipes={items} />

            {total > 0 ? (
              <footer className="mt-14 flex justify-center">
                <PaginationComponent
                  basePath="/recipes"
                  page={page}
                  pageItemSize={pageSize}
                  total={total}
                  query={paginationQuery}
                />
              </footer>
            ) : null}
          </Section>
        </div>
      </div>
    </main>
  );
}
