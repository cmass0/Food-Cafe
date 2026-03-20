"use client";

import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuth } from "@/app/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { listRecipes } from "@/domain/recipe/api";
import type {
  Recipe,
  RecipeListResult,
  RecipeSearchField,
  RecipeSort,
} from "@/domain/recipe/types";
import RecipeList from "@/domain/recipe/ui/RecipeList";
import { PaginationComponent } from "@/lib/pagenation/pagenation";
import SearchForm from "@/lib/searchForm/searchform";

const SORT_OPTIONS = [
  { key: "recent", title: "최신" },
  { key: "like", title: "좋아요" },
  { key: "view", title: "조회" },
];

const SEARCH_FIELD_OPTIONS: { value: RecipeSearchField; label: string }[] = [
  { value: "title", label: "제목" },
  { value: "tag", label: "태그" },
  { value: "tag_title", label: "태그 + 제목" },
  { value: "writer", label: "작성자" },
];

const DEFAULT_LIMIT = 12;

function RecipesPageInner() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [sort, setSort] = useState<RecipeSort>("recent");
  const [loading, setLoading] = useState(true);
  const [pageMeta, setPageMeta] = useState<Pick<RecipeListResult, "limit" | "offset" | "total">>({
    limit: DEFAULT_LIMIT,
    offset: 0,
    total: 0,
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const searchQuery = searchParams.get("search");
  const fieldParam = (searchParams.get("searchField") as RecipeSearchField) ?? "title";

  const parsedPage = Number(pageParam);
  const parsedLimit = Number(limitParam);
  const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_LIMIT;

  // 현재 page에 해당하는 recipe 목록
  useEffect(() => {
    let mounted = true;

    async function fetchRecipes() {
      setLoading(true);
      try {
        const data = await listRecipes({
          limit: safeLimit,
          page: safePage,
          sort,
          ...(searchQuery ? { search: searchQuery, searchField: fieldParam } : {}),
        });
        const items = (data?.items ?? []).map((item: any) => ({
          ...item,
          createdAt: item?.createdAt ? new Date(item.createdAt) : null,
          updatedAt: item?.updatedAt ? new Date(item.updatedAt) : null,
        }));
        if (mounted) {
          setRecipes(items);
          setPageMeta({
            limit: data.limit,
            offset: data.offset,
            total: data.total,
          });
        }
      } catch (error) {
        console.error("레시피 목록을 불러오는 데 실패했습니다.", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRecipes();
    return () => {
      mounted = false;
    };
  }, [safeLimit, safePage, user?.id, searchQuery, fieldParam, sort]);

  // 레시피 작성 페이지 이동
  function handleShare(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (!user) {
      openAuthModal({ next: "/recipes/new" });
      return;
    }
    router.push("/recipes/new");
  }

  function ReciepSearchHandler(
    event: React.FormEvent<HTMLFormElement>,
    searchText: string,
    searchField: RecipeSearchField
  ) {
    event.preventDefault();
    const trimmed = searchText.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      params.set("search", trimmed);
      params.set("searchField", searchField);
    }
    router.push(params.size ? `/recipes?${params.toString()}` : "/recipes");
  }

  const currentPage = safePage;
  const pageSize = pageMeta.limit > 0 ? pageMeta.limit : safeLimit;
  const paginationQuery: Record<string, string> = {};
  if (searchQuery) {
    paginationQuery.search = searchQuery;
    paginationQuery.searchField = fieldParam;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold">레시피</h1>
            <p className="text-sm text-muted-foreground">
              다양한 레시피를 찾아보고, 나만의 레시피도 공유해보세요!
            </p>
          </div>
          <Button className="gap-2 rounded-full px-5 py-2 text-base" onClick={handleShare}>
            <Plus className="h-4 w-4" />
            레시피 공유하기
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={sort}
            onValueChange={(value) => setSort(value as RecipeSort)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full max-w-sm grid-cols-3 rounded-full px-1.5 py-1 sm:w-auto">
              {SORT_OPTIONS.map(({ key, title }) => (
                <TabsTrigger key={key} value={key} className="rounded-full text-sm">
                  {title}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* 페이지 네비게이션 바 */}
          <SearchForm<RecipeSearchField>
            searchHandler={ReciepSearchHandler}
            searchoptions={SEARCH_FIELD_OPTIONS}
            searchQuery={searchQuery || ""}
            searchFieldQuery={fieldParam}
          />
        </div>
      </section>

      <section>
        <RecipeList recipes={recipes} className="mt-4" />
      </section>

      <footer className="flex justify-center">
        <PaginationComponent
          basePath="/recipes"
          page={currentPage}
          pageItemSize={pageSize}
          total={pageMeta.total}
          query={paginationQuery}
        />
      </footer>
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-6xl px-6 py-10" />}>
      <RecipesPageInner />
    </Suspense>
  );
}
