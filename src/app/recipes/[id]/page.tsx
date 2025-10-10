import { notFound } from "next/navigation";

import RecipeEditForm from "../_components/RecipeEditForm";
import DeleteRecipeButton from "../_components/DeleteRecipeButton";
import { getServerSupabase } from "@/lib/supabase/server";
import { getRecipe } from "@/features/recipe/service";
import LikeButton from "@/features/user_like/ui/likebutton";

type RecipeDetailPageProps = {
  params: { id: string };
};

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const supabase = getServerSupabase();
  const recipe = await getRecipe(supabase, params.id);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <article className="space-y-2">
        <h1 className="text-3xl font-semibold">{recipe.title}</h1>
        {recipe.summary ? <p className="text-base text-foreground/80">{recipe.summary}</p> : null}
        <dl className="grid grid-cols-2 gap-3 text-sm text-foreground/70">
          <div>
            <dt className="font-medium text-foreground">작성자</dt>
            <dd>{recipe.writerName ?? "익명"}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">작성일</dt>
            <dd>{recipe.createdAt.toLocaleString("ko-KR")}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">좋아요</dt>
            <dd>{recipe.likeCount}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">조회수</dt>
            <dd>{recipe.viewCount}</dd>
          </div>
        </dl>
      </article>

      <section className="space-y-4">
        <div>
        <LikeButton recipeId={recipe.id} initialLiked = {false} initialCount = {recipe.likeCount}/>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">레시피 수정</h2>
          <DeleteRecipeButton recipeId={recipe.id} />
        </div>
        <RecipeEditForm recipe={recipe} />
      </section>
    </main>
  );
}