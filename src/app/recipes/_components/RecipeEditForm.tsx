"use client";

import { useRouter } from "next/navigation";
import RecipeForm from "@/features/recipe/ui/RecipeForm";
import type { Recipe, RecipeInsertInput, RecipeUpdateInput } from "@/features/recipe/types";
import { updateRecipeAction } from "../actions";

type RecipeEditFormProps = {
  recipe: Recipe;
};

function toPatch(values: RecipeInsertInput): RecipeUpdateInput {
  return {
    title: values.title,
    summary: values.summary,
    recipe: values.recipe,
    image: values.image,
    images: values.images,
    tags: values.tags,
    category: values.category,
    // writerName: values.writerName,
    // writerEmail: values.writerEmail,
  };
}

export default function RecipeEditForm({ recipe }: RecipeEditFormProps) {
  const router = useRouter();

  const handleSubmit = async (values: RecipeInsertInput) => {
    await updateRecipeAction(recipe.id, toPatch(values));
    router.refresh();
  };

  return (
    <RecipeForm
      defaultValues={{
        title: recipe.title,
        summary: recipe.summary ?? undefined,
        recipe: recipe.recipe ?? undefined,
        image: recipe.image ?? undefined,
        tags: recipe.tags,
        category: recipe.category ?? undefined,
        // writerName: recipe.writerName ?? undefined,
        // writerEmail: recipe.writerEmail ?? undefined,
      }}
      submitLabel="레시피 수정"
      onSubmit={handleSubmit}
    />
  );
}
