import { Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import FoodImagePlaceholder from "@/components/FoodImagePlaceholder";
import ReactionCount from "@/components/reactions/ReactionCount";
import { getRecipeCategoryKey, getRecipeCategoryLabel } from "@/domain/recipe/category";
import type { Recipe } from "@/domain/recipe/types";
import { formatInKoreanTime } from "@/lib/format-date";
import { capImageDensity } from "@/lib/image-sizes";

function formatCount(value: number | null | undefined): string {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

// 카드 아래에 작성자·날짜·반응 수를 함께 넣으므로 올해 글은 연도를 뺀다.
function formatRecipeDate(value: Date | string | null | undefined): string {
  if (!value) return "날짜 없음";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 없음";
  const thisYear = formatInKoreanTime(new Date(), { year: "numeric" });
  const sameYear = formatInKoreanTime(date, { year: "numeric" }) === thisYear;
  return formatInKoreanTime(
    date,
    sameYear
      ? { month: "long", day: "numeric" }
      : { year: "numeric", month: "long", day: "numeric" }
  );
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
          label: `#${firstTag}`,
          href: `/recipes?search=${encodeURIComponent(firstTag)}&searchField=tag_title`,
        }
      : null;

  return (
    <article className="group @container">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#f3efe8] ring-1 ring-black/5 transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-zinc-900/10 sm:rounded-2xl">
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
              sizes={capImageDensity("(max-width: 1024px) 50vw, 25vw")}
              preload={preload}
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <FoodImagePlaceholder />
          )}
        </Link>
        {/* 이미지 링크 안에 넣으면 링크가 겹치므로 형제로 두고 위에 띄운다. */}
        {badge ? (
          <Link
            href={badge.href}
            className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-zinc-800 shadow-sm backdrop-blur transition hover:bg-white hover:text-[#34783f] sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]"
          >
            {badge.label}
          </Link>
        ) : null}
      </div>

      <div className="mt-2.5 px-0.5 sm:mt-3.5">
        <Link href={`/recipes/${recipe.id}`} prefetch={false}>
          <h2 className="line-clamp-1 text-sm font-bold tracking-tight text-zinc-950 transition-colors group-hover:text-[#34783f] sm:text-[15px]">
            {recipe.title}
          </h2>
        </Link>
        {/* 모바일 2열 카드는 좁아서 설명을 빼고 제목·작성자·반응만 남긴다. */}
        <p className="mt-1 hidden text-sm text-zinc-500 sm:line-clamp-1">
          {recipe.summary || "설명이 준비되지 않았어요"}
        </p>

        {/* 작성자와 반응 수는 카드 폭이 넉넉할 때만 한 줄에 둔다. 화면이 넓어도 4열이면 카드가 좁다. */}
        <div className="mt-2 flex flex-col items-start gap-1.5 text-[11px] text-zinc-400 sm:mt-3 sm:text-xs @min-[15.5rem]:flex-row @min-[15.5rem]:items-center @min-[15.5rem]:justify-between @min-[15.5rem]:gap-3">
          <div className="flex w-full min-w-0 items-center gap-1.5 @min-[15.5rem]:w-auto">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
              {initials(writerName)}
            </span>
            <span className="truncate font-medium text-zinc-600">{writerName}</span>
            <span className="shrink-0">·</span>
            <span className="shrink-0">{formatRecipeDate(recipe.createdAt)}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <ReactionCount
              kind="like"
              count={recipe.likeCount}
              mine={recipe.liked}
              className="gap-1"
              iconClassName="h-3.5 w-3.5"
            />
            <ReactionCount
              kind="bookmark"
              count={recipe.bookmarkCount}
              mine={recipe.bookmarked}
              className="gap-1"
              iconClassName="h-3.5 w-3.5"
            />
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">조회수</span>
              {formatCount(recipe.viewCount)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
