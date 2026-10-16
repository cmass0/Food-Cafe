import Link from "next/link";

import {
  getRecipeCategoryLabel,
  RECIPE_CATEGORY_KEYS,
  type RecipeCategoryKey,
} from "@/domain/recipe/category";
import { toRecipeListQuery, type RecipeListQuery } from "@/domain/recipe/list-params";
import { cn } from "@/lib/utils";

type RecipeCategoryChipsProps = Omit<RecipeListQuery, "category"> & {
  category?: RecipeCategoryKey;
  className?: string;
};

const CHIPS: { key: RecipeCategoryKey | undefined; label: string }[] = [
  { key: undefined, label: "전체" },
  ...RECIPE_CATEGORY_KEYS.map((key) => ({ key, label: getRecipeCategoryLabel(key) })),
];

// 카테고리만 바꾸고 정렬·검색 조건은 유지한다. 결과 범위가 달라지므로 page는 1로 돌아간다.
export default function RecipeCategoryChips({
  category,
  className,
  ...query
}: RecipeCategoryChipsProps) {
  return (
    <nav
      aria-label="레시피 카테고리"
      className={cn(
        "-mx-5 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {/* 머리말 아래 선에 붙는 밑줄 탭. 고른 카테고리만 초록 밑줄을 긋는다. */}
      <ul className="flex w-max gap-6">
        {CHIPS.map(({ key, label }) => {
          const params = new URLSearchParams(toRecipeListQuery({ ...query, category: key }));
          const href = params.size ? `/recipes?${params.toString()}` : "/recipes";
          const active = key === category;
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-11 items-center text-sm whitespace-nowrap transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full",
                  active
                    ? "font-semibold text-zinc-900 after:bg-[#34783f]"
                    : "font-medium text-zinc-500 hover:text-zinc-900"
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
