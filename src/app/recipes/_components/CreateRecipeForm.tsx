"use client";

import RecipeForm from "@/features/recipe/ui/RecipeForm";
import type { RecipeInsertInput } from "@/features/recipe/types";
import { createRecipeAction } from "../actions";

export default function CreateRecipeForm() {
  const handleSubmit = async (values: RecipeInsertInput) => {
    await createRecipeAction(values);
  };

  return <RecipeForm onSubmit={(values) => handleSubmit(values)} submitLabel="레시피 등록" />;
}
