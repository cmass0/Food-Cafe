import Link from "next/link";

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
      <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-6 py-16 text-center">
        <p className="text-sm font-semibold text-zinc-700">조건에 맞는 레시피가 없습니다.</p>
        <p className="mt-2 text-sm text-zinc-500">검색어를 바꾸거나 새 레시피를 공유해보세요.</p>
      </div>
    );
  }

  // 모바일 첫 화면에는 카드가 하나만 보인다. 사진이 있는 첫 카드만 미리 받는다.
  // 더 미리 받으면 사진끼리 회선을 나눠 첫 사진이 늦어지고, 첫 카드에 사진이 없으면 인덱스 0은 효과가 없다.
  const preloadIndex = recipes.findIndex((recipe) => recipe.image);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="mx-auto w-full max-w-7xl px-5 py-10 md:py-12 lg:px-8">
        <section className="mb-10 space-y-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-zinc-950">
                  {categoryLabel ? `${categoryLabel} 레시피` : "레시피"}
                </h1>
                {category ? (
                  <Link
                    href="/recipes"
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    전체 보기
                  </Link>
                ) : null}
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-500">
                다양한 레시피를 찾아보고, 나만의 레시피도 공유해보세요!
              </p>
            </div>
            <ShareRecipeButton />
          </div>

          <RecipesToolbar
            sort={sort}
            category={category}
            searchQuery={searchQuery}
            searchField={searchField}
            limit={pageSize}
          />
        </section>

        <Section
          name="recipes.list"
          failed={listResult.error}
          outOfRange={listResult.outOfRange}
          title="레시피 목록을 표시하지 못했습니다."
          resetKeys={[page, limit, searchQuery, searchField, sort, category]}
        >
          <RecipesGrid recipes={items} />

          {total > 0 ? (
            <footer className="mt-10 flex justify-center">
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
    </main>
  );
}
