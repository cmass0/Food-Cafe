import { ChefHat, Eye, Heart, SearchX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { Recipe, RecipeListResult } from "@/domain/recipe/types";
import { PaginationComponent } from "@/lib/pagenation/pagenation";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

type Props = {
  recipes: RecipeListResult;
  searchParams: Record<string, string | string[] | undefined>;
  queryText: string;
  viewMode: ViewMode;
};

function formatCount(value: number | null | undefined): string {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function writerLabel(recipe: Recipe): string {
  return recipe.writerName ?? "무명 셰프";
}

function firstTag(recipe: Recipe): string {
  return recipe.category ?? recipe.tags[0] ?? "레시피";
}

function buildMoreHref(queryText: string): string {
  const params = new URLSearchParams();
  if (queryText) {
    params.set("search", queryText);
    params.set("searchField", "tag_title");
  }
  const query = params.toString();
  return query ? `/recipes?${query}` : "/recipes";
}

function RecipeResultCard({ recipe, viewMode }: { recipe: Recipe; viewMode: ViewMode }) {
  const tag = firstTag(recipe);

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md",
        viewMode === "list" && "grid md:grid-cols-[260px_1fr]"
      )}
    >
      <Link
        href={`/recipes/${recipe.id}`}
        prefetch={false}
        className={cn(
          "relative block aspect-[16/9] overflow-hidden bg-emerald-50",
          viewMode === "list" && "md:aspect-auto md:min-h-[172px]"
        )}
        aria-label={`${recipe.title} 상세 보기`}
      >
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title || "레시피 이미지"}
            fill
            sizes={
              viewMode === "list"
                ? "(max-width: 768px) 100vw, 260px"
                : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            }
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-emerald-700">
            이미지 준비 중
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-col gap-3 p-4">
        <div className="min-w-0">
          <Link href={`/recipes/${recipe.id}`} prefetch={false}>
            <h3 className="line-clamp-1 text-base font-black tracking-tight text-zinc-950">
              {recipe.title}
            </h3>
          </Link>
          <p className="mt-2 line-clamp-1 text-sm font-medium text-zinc-500">
            {recipe.summary || "설명이 준비되지 않았어요"}
          </p>
        </div>

        <Link
          href={`/recipes?search=${encodeURIComponent(tag)}&searchField=tag_title`}
          prefetch={false}
          className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#438e4d] transition hover:bg-emerald-100"
        >
          #{tag}
        </Link>

        <div className="mt-auto flex items-center justify-between gap-3 text-xs font-medium text-zinc-500">
          <span className="min-w-0 truncate">{writerLabel(recipe)}</span>
          <span className="flex shrink-0 items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {formatCount(recipe.likeCount)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {formatCount(recipe.viewCount)}
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}

export default function SearchResultRecipe({
  recipes,
  searchParams,
  queryText,
  viewMode,
}: Props) {
  const recipeItems = recipes.items;
  const currentPage = Number(searchParams.recipePage) || 1;
  const gridClass =
    viewMode === "list"
      ? "grid grid-cols-1 gap-4"
      : "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4";

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-50 text-[#15933d]">
            <ChefHat className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-black tracking-tight text-zinc-950">레시피</h2>
          <span className="text-base font-black text-[#15933d]">
            {formatCount(recipes.total)}
          </span>
        </div>
        <Link
          href={buildMoreHref(queryText)}
          prefetch={false}
          className="text-sm font-bold text-zinc-500 transition hover:text-[#15933d]"
        >
          더보기
        </Link>
      </header>

      {recipeItems.length === 0 ? (
        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 text-center">
          <SearchX className="h-7 w-7 text-zinc-300" />
          <p className="mt-3 text-sm font-bold text-zinc-700">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className={gridClass}>
          {recipeItems.map((recipe) => (
            <RecipeResultCard key={recipe.id} recipe={recipe} viewMode={viewMode} />
          ))}
        </div>
      )}

      {recipes.total > 0 ? (
        <div className="mt-5">
          <PaginationComponent
            basePath="/search"
            page={currentPage}
            pageItemSize={recipes.limit}
            blockSize={5}
            total={recipes.total}
            query={searchParams}
            pageParam="recipePage"
            scroll={false}
          />
        </div>
      ) : null}
    </section>
  );
}
