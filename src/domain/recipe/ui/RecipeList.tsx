import type { Recipe } from "../types";
import RecipeCard from "./RecipeCard";

type RecipeListProps = {
  recipes: Recipe[];
  emptyMessage?: string;
  className?: string;
};

export default function RecipeList({
  recipes,
  emptyMessage = "등록된 레시피가 없습니다.",
  className,
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
              initialLiked={recipe.liked ?? false}
              initialCount={recipe.likeCount ?? 0}
              initialBookmarked={recipe.bookmarked ?? false}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
