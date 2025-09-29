import type { Recipe } from "../types";

type RecipeCardProps = {
  recipe: Recipe;
};

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <article className="rounded-lg border border-divider bg-background p-4 shadow-sm">
      <header className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{recipe.title}</h3>
        {typeof recipe.likeCount === "number" && (
          <span className="text-sm text-foreground/70">?? {recipe.likeCount}</span>
        )}
      </header>
      {recipe.summary && <p className="mb-3 text-sm text-foreground/80">{recipe.summary}</p>}
      <footer className="flex flex-wrap gap-2 text-xs text-foreground/60">
        <span>작성자: {recipe.writerName ?? "미상"}</span>
        <span>조회수: {recipe.viewCount ?? 0}</span>
        <span>
          생성일: {recipe.createdAt.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}
        </span>
      </footer>
    </article>
  );
}
