"use client";

import type { Recipe, RecipeInsertDB, RecipeUpdateDB } from "@/domain/recipe/types";
import RecipeForm from "@/domain/recipe/ui/RecipeForm";
import { useRouter } from "next/navigation";
import { updateRecipeAction } from "../actions";

type RecipeEditFormProps = {
  recipe: Recipe;
};

function toPatch(values: RecipeInsertDB): RecipeUpdateDB {
  return {
    title: values.title,
    summary: values.summary,
    steps: values.steps,
    image: values.image,
    tags: values.tags,
    category: values.category,
    difficulty: values.difficulty,
    time_minutes: values.time_minutes,
    servings: values.servings,
  };
}

export default function RecipeEditForm({ recipe }: RecipeEditFormProps) {
  const router = useRouter();

  const handleSubmit = async (values: RecipeInsertDB) => {
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
        time_minutes: recipe.timeMinutes ?? undefined,
        servings: recipe.servings ?? undefined,
      }}
      submitLabel="수정하기"
      onSubmit={(values) => handleSubmit(values)}
    />
  );
}
