import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import DeleteRecipeButton from "../_components/DeleteRecipeButton";
import { getServerSupabase } from "@/lib/supabase/server";
import { getRecipe } from "@/features/recipe/service";
import RecipeDetail from "@/features/recipe/ui/RecipeDetail";

type RecipeDetailPageProps = {
  params: { id: string };
};

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  noStore();
  const supabase = getServerSupabase();
  const recipe = await getRecipe(supabase, params.id);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <RecipeDetail recipe={recipe} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold"></h2>
          <DeleteRecipeButton recipeId={recipe.id} />
        </div>
        {/* <RecipeEditForm recipe={recipe} /> */}
      </section>
    </main>
  );
}
