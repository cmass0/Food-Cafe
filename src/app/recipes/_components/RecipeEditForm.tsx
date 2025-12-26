"use client";

import type { Recipe, RecipeInsertInput, RecipeUpdateInput } from "@/features/recipe/types";
import RecipeForm from "@/features/recipe/ui/RecipeForm";
import { useRouter } from "next/navigation";
import { updateRecipeAction } from "../actions";

type RecipeEditFormProps = {
  recipe: Recipe;
};

function toPatch(values: RecipeInsertInput): RecipeUpdateInput {
  return {
    title: values.title,
    summary: values.summary,
    steps: values.steps,
    image: values.image,
    tags: values.tags,
    category: values.category,
    difficulty: values.difficulty,
    timeMinutes: values.timeMinutes,
    servings: values.servings,
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
        steps: recipe.steps ?? undefined,
        image: recipe.image ?? undefined,
        tags: recipe.tags,
        category: recipe.category ?? undefined,
        difficulty: recipe.difficulty ?? undefined,
        timeMinutes: recipe.timeMinutes ?? undefined,
        servings: recipe.servings ?? undefined,
      }}
      submitLabel="수정하기"
      onSubmit={(values) => handleSubmit(values)}
    />
  );
}
