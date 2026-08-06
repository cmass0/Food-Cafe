import { getRecipeById } from "@/domain/recipe/service";
import { requireOwnedContent } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import UpdateRecipeForm from "../components/UpdateRecipeForm";

export default async function RecipeEditPage(props: { searchParams: Promise<{ id?: string }> }) {
  const searchParams = await props.searchParams;
  const id = searchParams?.id;
  if (!id) notFound();

  const next = `/recipes/edit?id=${encodeURIComponent(id)}`;
  const recipe = await requireOwnedContent(next, (supabase) => getRecipeById(supabase, id));

  const defaultValues = {
    title: recipe.title,
    summary: recipe.summary || "",
    chef_tip: recipe.chefTip || "",
    steps: recipe.steps || [],
    image: recipe.image || null,
    images: recipe.images,
    tags: recipe.tags,
    ingredients: recipe.ingredients || [],
    category: recipe.category || "",
    difficulty: recipe.difficulty || "",
    time_minutes: recipe.timeMinutes || 0,
    servings: recipe.servings || 0,
    tools: recipe.tools || [],
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <UpdateRecipeForm recipeId={recipe.id} defaultValues={defaultValues} />
    </div>
  );
}
