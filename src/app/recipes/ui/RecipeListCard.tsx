import Image from "next/image";
import Link from "next/link";

import FoodCardFacts from "@/components/food-card/FoodCardFacts";
import FoodCardFooter from "@/components/food-card/FoodCardFooter";
import FoodImagePlaceholder from "@/components/FoodImagePlaceholder";
import { getRecipeCategoryKey, getRecipeCategoryLabel } from "@/domain/recipe/category";
import type { Recipe } from "@/domain/recipe/types";
import { formatInKoreanTime } from "@/lib/format-date";
import { capImageDensity } from "@/lib/image-sizes";

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
      <Link
        href={`/recipes/${recipe.id}`}
        prefetch={false}
        aria-label={`${recipe.title} 상세 보기`}
        className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-[#f3efe8] outline-none focus-visible:ring-2 focus-visible:ring-[#34783f] focus-visible:ring-offset-2"
      >
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title || "레시피 이미지"}
            fill
            sizes={capImageDensity("(max-width: 1024px) 50vw, 25vw")}
            preload={preload}
            className="object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <FoodImagePlaceholder />
        )}
      </Link>

      <div className="mt-3 px-0.5">
        <FoodCardFacts
          lead={
            badge ? (
              <Link
                href={badge.href}
                className="font-semibold text-[#34783f] underline-offset-2 hover:underline"
              >
                {badge.label}
              </Link>
            ) : null
          }
          timeMinutes={recipe.timeMinutes}
          difficulty={recipe.difficulty}
        />
        <Link href={`/recipes/${recipe.id}`} prefetch={false}>
          <h2 className="mt-1 line-clamp-1 text-[15px] font-semibold tracking-tight text-zinc-900 transition-colors group-hover:text-[#34783f] sm:text-base">
            {recipe.title}
          </h2>
        </Link>
        {/* 모바일 2열 카드는 좁아서 설명을 빼고 제목·작성자·반응만 남긴다. */}
        <p className="mt-0.5 hidden text-sm leading-6 text-zinc-500 sm:line-clamp-1">
          {recipe.summary || "설명이 준비되지 않았어요"}
        </p>

        <FoodCardFooter
          className="mt-3"
          writerName={writerName}
          dateLabel={formatRecipeDate(recipe.createdAt)}
          likeCount={recipe.likeCount}
          liked={recipe.liked}
          bookmarkCount={recipe.bookmarkCount}
          bookmarked={recipe.bookmarked}
          viewCount={recipe.viewCount}
        />
      </div>
    </article>
  );
}
