import { notFound } from "next/navigation";

import RecipeEditForm from "../_components/RecipeEditForm";
import DeleteRecipeButton from "../_components/DeleteRecipeButton";
import { getServerSupabase } from "@/lib/supabase/server";
import { getRecipe } from "@/features/recipe/service";
import LikeButton from "@/features/user_like/ui/likebutton";
import { getLikeMeta } from "@/features/user_like/service";
import RecipeDetail from "@/features/recipe/ui/RecipeDetail";

type RecipeDetailPageProps = {
  params: { id: string };
};

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const supabase = getServerSupabase();
  const recipe = await getRecipe(supabase, params.id);

  if (!recipe) {
    notFound();
  }

  const { liked, count } = await getLikeMeta(recipe.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <RecipeDetail recipe={recipe} />

      <section className="space-y-4">
        <div>
          <LikeButton recipeId={recipe.id} initialLiked={liked} initialCount={count} />
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold"></h2>
          <DeleteRecipeButton recipeId={recipe.id} />
        </div>
        {/* <RecipeEditForm recipe={recipe} /> */}
      </section>
    </main>
  );
}