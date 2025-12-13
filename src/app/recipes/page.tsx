"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import RecipeList from "@/features/recipe/ui/RecipeList";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginationComponent } from "@/components/pagenation/pagenation";
import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/features/auth/ui/AuthModalProvider";
import { listRecipes } from "@/features/recipe/api";
import type { Recipe, RecipeListResult } from "@/features/recipe/types";
import type { Recipe as RecipeType } from "@/features/recipe/types";

const SORT_OPTIONS = [
  { key: "recent", title: "최신" },
  { key: "like", title: "좋아요" },
  { key: "view", title: "조회" },
];

const DEFAULT_LIMIT = 12;

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [sort, setSort] = useState<string>("recent");
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
  const [likedSet, setLikedSet] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;

    async function fetchRecipes() {
      const parsedPage = Number(pageParam);
      const parsedLimit = Number(limitParam);
      const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_LIMIT;
      const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

      setLoading(true);
      try {
        const data = await listRecipes({ limit, page });
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
          setLikedSet({});
          setLikeCounts({});
        }
      } catch (error) {
        console.error("레시피 목록을 불러오는데 실패했습니다.", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRecipes();
    return () => {
      mounted = false;
    };
  }, [pageParam, limitParam]);

  // 좋아요 메타 정보 조회 (사용자별 liked + 최신 카운트)
  useEffect(() => {
    let cancelled = false;
    async function fetchLikeMeta(current: RecipeType[]) {
      if (!current.length) {
        setLikedSet({});
        setLikeCounts({});
        return;
      }
      const ids = current.map((r) => r.id);
      const params = new URLSearchParams({ ids: ids.join(",") });
      try {
        const res = await fetch(`/api/recipes/like?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        const likedIds: string[] = json?.data?.liked ?? [];
        const counts: Record<string, number> = json?.data?.counts ?? {};
        const nextSet: Record<string, boolean> = {};
        likedIds.forEach((id) => {
          nextSet[id] = true;
        });
        setLikedSet(nextSet);
        setLikeCounts(counts);
      } catch (e) {
        console.error("레시피 좋아요 정보를 불러오지 못했습니다.", e);
      }
    }

    fetchLikeMeta(recipes);
    return () => {
      cancelled = true;
    };
  }, [recipes]);

  // 레시피 정렬
  const sortedRecipes = useMemo(() => {
    const base = [...recipes];
    if (sort === "like") {
      return base.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    }
    if (sort === "view") {
      return base.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    }
    return base.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
  }, [recipes, sort]);

  function handleShare(event?: React.MouseEvent<HTMLButtonElement>) {
    event?.preventDefault();
    if (!user) {
      openAuthModal({ next: "/recipes/new" });
      return;
    }
    router.push("/recipes/new");
  }

  const pageSize = pageMeta.limit > 0 ? pageMeta.limit : DEFAULT_LIMIT;
  const currentPage = pageSize > 0 ? Math.floor(pageMeta.offset / pageSize) + 1 : 1;

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

        <Tabs value={sort} onValueChange={setSort} className="w-full">
          <TabsList className="grid w-full max-w-sm grid-cols-3 rounded-full px-1.5 py-1">
            {SORT_OPTIONS.map(({ key, title }) => (
              <TabsTrigger key={key} value={key} className="rounded-full text-sm">
                {title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </section>

      <section>
        <RecipeList
          recipes={sortedRecipes}
          initset={likedSet}
          initialCounts={likeCounts}
          className="mt-4"
        />
      </section>

      <footer className="flex justify-center">
        <PaginationComponent
          basePath="/recipes"
          page={currentPage}
          pageSize={pageSize}
          total={pageMeta.total}
        />
      </footer>
    </div>
  );
}
