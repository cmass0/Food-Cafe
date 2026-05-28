"use client";

import { Bookmark, Eye, Heart, Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuth } from "@/app/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { listRecipes } from "@/domain/recipe/api";
import { toggleRecipeBookmark } from "@/domain/recipe/recipe_bookmark/api";
import { toggleRecipeLike } from "@/domain/recipe/recipe_like/api";
import type {
  Recipe,
  RecipeListResult,
  RecipeSearchField,
  RecipeSort,
} from "@/domain/recipe/types";
import { PaginationComponent } from "@/lib/pagenation/pagenation";

const SORT_OPTIONS: { key: RecipeSort; title: string }[] = [
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

const DEFAULT_LIMIT = 8;

function formatCount(value: number | null | undefined): string {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function formatRecipeDate(value: Date | string | null | undefined): string {
  if (!value) return "날짜 없음";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 없음";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "U";
}

function RecipesPageCard({ recipe }: { recipe: Recipe }) {
  const [liked, setLiked] = useState(recipe.liked ?? false);
  const [likeCount, setLikeCount] = useState(recipe.likeCount ?? 0);
  const [bookmarked, setBookmarked] = useState(recipe.bookmarked ?? false);
  const [bookmarkCount, setBookmarkCount] = useState(recipe.bookmarkCount ?? 0);
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    setLiked(recipe.liked ?? false);
    setLikeCount(recipe.likeCount ?? 0);
    setBookmarked(recipe.bookmarked ?? false);
    setBookmarkCount(recipe.bookmarkCount ?? 0);
  }, [recipe]);

  function requireAuth() {
    const current = new URL(window.location.href);
    openAuthModal({ next: `${current.pathname}${current.search}` });
  }

  async function handleLike() {
    if (!user) {
      requireAuth();
      return;
    }

    try {
      const next = await toggleRecipeLike(recipe.id);
      setLiked(next.liked);
      if (typeof next.likeCount === "number") {
        setLikeCount(next.likeCount);
      }
    } catch (error) {
      console.error("좋아요 처리에 실패했습니다.", error);
    }
  }

  async function handleBookmark() {
    if (!user) {
      requireAuth();
      return;
    }

    try {
      const next = await toggleRecipeBookmark(recipe.id, bookmarked);
      setBookmarked(next.bookmarked);
      if (typeof next.bookmarkCount === "number") {
        setBookmarkCount(next.bookmarkCount);
      }
    } catch (error) {
      console.error("북마크 처리에 실패했습니다.", error);
    }
  }

  const writerName = recipe.writerName ?? "무명 셰프";
  const tag = recipe.category ?? recipe.tags[0] ?? "레시피";

  return (
    <article className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/2.5] overflow-hidden bg-emerald-50">
        <Link href={`/recipes/${recipe.id}`} prefetch={false} aria-label={`${recipe.title} 상세 보기`}>
          {recipe.image ? (
            <Image
              src={recipe.image}
              alt={recipe.title || "레시피 이미지"}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-sm font-medium text-emerald-700">
              이미지 준비 중
            </div>
          )}
        </Link>

        <button
          type="button"
          aria-label={`북마크 ${formatCount(bookmarkCount)}`}
          onClick={handleBookmark}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#438e4d] shadow-sm transition hover:bg-white"
        >
          <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-[#438e4d]" : ""}`} />
        </button>

        <button
          type="button"
          aria-label={`좋아요 ${formatCount(likeCount)}`}
          onClick={handleLike}
          className="absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-red-500 shadow-sm transition hover:bg-white"
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-red-500" : ""}`} />
        </button>
      </div>

      <div className="space-y-3 p-4">
        <div className="space-y-2">
          <Link href={`/recipes/${recipe.id}`} prefetch={false}>
            <h2 className="line-clamp-1 text-base font-bold tracking-tight text-zinc-950">
              {recipe.title}
            </h2>
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
              {initials(writerName)}
            </span>
            <span>{writerName}</span>
            <span>·</span>
            <span>{formatRecipeDate(recipe.createdAt)}</span>
          </div>
        </div>

        <p className="line-clamp-1 text-sm text-zinc-500">
          {recipe.summary || "설명이 준비되지 않았어요"}
        </p>

        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-500">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              {formatCount(likeCount)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bookmark className="h-4 w-4" />
              {formatCount(bookmarkCount)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {formatCount(recipe.viewCount)}
            </span>
          </div>
          <Link
            href={`/recipes?search=${encodeURIComponent(tag)}&searchField=tag_title`}
            className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-[#438e4d] transition hover:bg-emerald-100"
          >
            #{tag}
          </Link>
        </div>
      </div>
    </article>
  );
}

function RecipesGrid({ recipes, loading }: { recipes: Recipe[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: DEFAULT_LIMIT }).map((_, index) => (
          <div
            key={index}
            className="h-[330px] animate-pulse rounded-lg border border-zinc-200 bg-zinc-50"
          />
        ))}
      </div>
    );
  }

  if (!recipes.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-6 py-16 text-center">
        <p className="text-sm font-semibold text-zinc-700">조건에 맞는 레시피가 없습니다.</p>
        <p className="mt-2 text-sm text-zinc-500">검색어를 바꾸거나 새 레시피를 공유해보세요.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {recipes.map((recipe) => (
        <RecipesPageCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}

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

  const [searchText, setSearchText] = useState(searchQuery ?? "");
  const [searchField, setSearchField] = useState<RecipeSearchField>(fieldParam);

  const parsedPage = Number(pageParam);
  const parsedLimit = Number(limitParam);
  const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_LIMIT;

  useEffect(() => {
    setSearchText(searchQuery ?? "");
    setSearchField(fieldParam);
  }, [searchQuery, fieldParam]);

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
        const items = (data?.items ?? []).map((item: Recipe) => ({
          ...item,
          createdAt: item?.createdAt ? new Date(item.createdAt) : null,
          updatedAt: item?.updatedAt ? new Date(item.updatedAt) : null,
        })) as Recipe[];
        if (mounted) {
          setRecipes(items);
          setPageMeta({
            limit: data.limit,
            offset: data.offset,
            total: data.total,
          });
        }
      } catch (error) {
        console.error("레시피 목록을 불러오지 못했습니다.", error);
        if (mounted) {
          setRecipes([]);
          setPageMeta({ limit: safeLimit, offset: 0, total: 0 });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRecipes();
    return () => {
      mounted = false;
    };
  }, [safeLimit, safePage, user?.id, searchQuery, fieldParam, sort]);

  function handleShare(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (!user) {
      openAuthModal({ next: "/recipes/new" });
      return;
    }
    router.push("/recipes/new");
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
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
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 md:py-12 lg:px-8">
        <section className="mb-10 space-y-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-zinc-950">레시피</h1>
              <p className="mt-3 text-sm font-medium text-zinc-500">
                다양한 레시피를 찾아보고, 나만의 레시피도 공유해보세요!
              </p>
            </div>
            <Button
              className="h-12 rounded-full bg-[#16a34a] px-7 text-base font-bold text-white shadow-sm hover:bg-[#138a3f]"
              onClick={handleShare}
            >
              <Plus className="mr-2 h-5 w-5" />
              레시피 공유하기
            </Button>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs
              value={sort}
              onValueChange={(value) => setSort(value as RecipeSort)}
              className="w-full md:w-auto"
            >
              <TabsList className="h-12 w-full max-w-[260px] rounded-full bg-zinc-100 p-1.5 md:w-auto">
                {SORT_OPTIONS.map(({ key, title }) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="h-9 rounded-full px-5 text-sm font-bold text-zinc-500 data-[state=active]:bg-[#3f914b] data-[state=active]:text-white data-[state=active]:shadow-none"
                  >
                    {title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <form
              onSubmit={handleSearchSubmit}
              className="flex h-12 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm md:max-w-[470px]"
            >
              <select
                value={searchField}
                onChange={(event) => setSearchField(event.target.value as RecipeSearchField)}
                className="w-32 border-0 border-r border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-800 outline-none"
                aria-label="검색 범위"
              >
                {SEARCH_FIELD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="레시피 검색..."
                  className="min-w-0 flex-1 border-0 text-sm outline-none placeholder:text-zinc-400"
                />
                <button type="submit" aria-label="검색" className="text-zinc-500 hover:text-zinc-900">
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </section>

        <RecipesGrid recipes={recipes} loading={loading} />

        <footer className="mt-10 flex justify-center">
          <PaginationComponent
            basePath="/recipes"
            page={currentPage}
            pageItemSize={pageSize}
            total={pageMeta.total}
            query={paginationQuery}
          />
        </footer>
      </div>
    </main>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8" />}>
      <RecipesPageInner />
    </Suspense>
  );
}
