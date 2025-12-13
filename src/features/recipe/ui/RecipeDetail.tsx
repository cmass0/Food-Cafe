import RecipeComments from "@/features/comment/ui/RecipeComments.client";
import type { Recipe } from "../types";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function RecipeDetail({ recipe }: { recipe: Recipe }) {
  return (
    <div>
      <article className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold">{recipe.title}</h1>
          {recipe.summary ? <p className="text-base text-foreground/80">{recipe.summary}</p> : null}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>작성자 {recipe.writerName ?? "익명"}</span>
            <span aria-hidden="true">·</span>
            <span>{recipe.createdAt.toLocaleString("ko-KR")}</span>
            <span aria-hidden="true">·</span>
            <span>조회수 {recipe.viewCount ?? 0}</span>
            {recipe.category ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{recipe.category}</span>
              </>
            ) : null}
          </div>
        </header>

        {recipe.recipe ? (
          <section
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: recipe.recipe }}
          />
        ) : null}
      </article>
      <RecipeComments recipeId={recipe.id} pageSize={10} items={[]} />
    </div>
  );
}
