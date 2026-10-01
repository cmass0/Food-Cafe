import { Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import ReactionCount from "@/components/reactions/ReactionCount";
import { getRecipeCategoryKey, getRecipeCategoryLabel } from "@/domain/recipe/category";
import type { Recipe } from "@/domain/recipe/types";
import { formatInKoreanTime } from "@/lib/format-date";
import { capImageDensity } from "@/lib/image-sizes";

function formatCount(value: number | null | undefined): string {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function formatRecipeDate(value: Date | string | null | undefined): string {
  if (!value) return "날짜 없음";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 없음";
  return formatInKoreanTime(date, { year: "numeric", month: "long", day: "numeric" });
}

function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "U";
}

type RecipeListCardProps = {
  recipe: Recipe;
  // 첫 화면에 바로 보이는 카드만 이미지를 HTML과 함께 미리 받는다. 나머지는 지연 로딩한다.
  preload?: boolean;
};

// 목록 카드는 보여주기만 한다. 좋아요·북마크는 상세 화면에서 누른다.
export default function RecipeListCard({ recipe, preload = false }: RecipeListCardProps) {
  const writerName = recipe.writerName ?? "무명 셰프";
  // 카테고리는 태그가 아니라서 태그 검색으로는 찾을 수 없다. 필터가 있는 카테고리는 카테고리 목록으로,
  // 없으면("기타" 등) 첫 태그 검색으로 보낸다.
  const categoryKey = getRecipeCategoryKey(recipe.category);
  const firstTag = recipe.tags[0];
  const badge = categoryKey
    ? { label: getRecipeCategoryLabel(categoryKey), href: `/recipes?category=${categoryKey}` }
    : firstTag
      ? {
          label: firstTag,
          href: `/recipes?search=${encodeURIComponent(firstTag)}&searchField=tag_title`,
        }
      : null;

  return (
    <article className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/2.5] overflow-hidden bg-emerald-50">
        <Link
          href={`/recipes/${recipe.id}`}
          prefetch={false}
          aria-label={`${recipe.title} 상세 보기`}
          className="relative block h-full w-full"
        >
          {recipe.image ? (
            <Image
              src={recipe.image}
              alt={recipe.title || "레시피 이미지"}
              fill
              sizes={capImageDensity("(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw")}
              preload={preload}
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-sm font-medium text-emerald-700">
              이미지 준비 중
            </div>
          )}
        </Link>
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
            <ReactionCount kind="like" count={recipe.likeCount} mine={recipe.liked} />
            <ReactionCount kind="bookmark" count={recipe.bookmarkCount} mine={recipe.bookmarked} />
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {formatCount(recipe.viewCount)}
            </span>
          </div>
          {badge ? (
            <Link
              href={badge.href}
              className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-[#34783f] transition hover:bg-emerald-100"
            >
              #{badge.label}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
