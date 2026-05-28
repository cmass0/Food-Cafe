import { getRecipeById } from "@/domain/recipe/service";
import { getServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import UpdateRecipeForm from "../components/UpdateRecipeForm";

export default async function RecipeEditPage(props: { searchParams: Promise<{ id?: string }> }) {
  const searchParams = await props.searchParams;
  const id = searchParams?.id;
  if (!id) notFound();

  const supabase = await getServerSupabase();
  const recipe = await getRecipeById(supabase, id);
  if (!recipe) {
    notFound();
  }

  const defaultValues = {
    title: recipe.title,
    summary: recipe.summary || "",
    steps: recipe.steps || [],
    image: recipe.image || null,
    tags: recipe.tags,
    ingredients: recipe.ingredients || [],
    category: recipe.category || "",
    difficulty: recipe.difficulty || "",
    time_minutes: recipe.timeMinutes || 0,
    servings: recipe.servings || 0,
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <UpdateRecipeForm recipeId={recipe.id} defaultValues={defaultValues} />
    </div>
  );
}
