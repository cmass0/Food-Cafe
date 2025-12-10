import type { Recipe } from "../types";
import RecipeCard from "./RecipeCard";

type RecipeListProps = {
  recipes: Recipe[];
  emptyMessage?: string;
  className?: string;
  initset: Record<string, boolean>;
  initialCounts?: Record<string, number>;
};

export default function RecipeList({
  recipes,
  emptyMessage = "등록된 레시피가 없습니다.",
  className,
  initset,
  initialCounts,
}: RecipeListProps) {
  if (!recipes.length) {
    return <p className={className}>{emptyMessage}</p>;
  }

  return (
    <div className={className}>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <RecipeCard
              recipe={recipe}
              initialLiked={initset?.[recipe.id] ?? false}
              initialCount={initialCounts?.[recipe.id] ?? recipe.likeCount ?? 0}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

