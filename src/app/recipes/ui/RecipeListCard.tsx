import Image from "next/image";
import Link from "next/link";

import FoodCardFacts from "@/components/food-card/FoodCardFacts";
import FoodCardFooter from "@/components/food-card/FoodCardFooter";
import FoodImagePlaceholder from "@/components/FoodImagePlaceholder";
import { getRecipeCategoryKey, getRecipeCategoryLabel } from "@/domain/recipe/category";
import type { Recipe } from "@/domain/recipe/types";
import { capImageDensity } from "@/lib/image-sizes";

type RecipeListCardProps = {
  recipe: Recipe;
  // 첫 화면에 바로 보이는 카드만 이미지를 HTML과 함께 미리 받는다. 나머지는 지연 로딩한다.
  preload?: boolean;
};

// 목록 카드는 사진·제목·요리 정보·작성자만 보여준다. 작성일·설명·좋아요 외 반응 수는 상세 화면에서 본다.
// 좋아요·북마크도 상세 화면에서 누른다.
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
    <article className="group">
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
            className="object-cover"
          />
        ) : (
          <FoodImagePlaceholder />
        )}
      </Link>

      <div className="mt-3">
        <h2 className="line-clamp-1 text-[15px] font-semibold tracking-tight text-zinc-900 sm:text-base">
          <Link
            href={`/recipes/${recipe.id}`}
            prefetch={false}
            className="decoration-zinc-300 underline-offset-4 group-hover:underline"
          >
            {recipe.title}
          </Link>
        </h2>
        <FoodCardFacts
          className="mt-1 sm:text-[13px]"
          lead={
            badge ? (
              <Link
                href={badge.href}
                className="underline-offset-2 transition-colors hover:text-[#34783f] hover:underline"
              >
                {badge.label}
              </Link>
            ) : null
          }
          timeMinutes={recipe.timeMinutes}
          difficulty={recipe.difficulty}
        />

        <FoodCardFooter
          className="mt-2.5"
          writerName={writerName}
          likeCount={recipe.likeCount}
          liked={recipe.liked}
        />
      </div>
    </article>
  );
}
