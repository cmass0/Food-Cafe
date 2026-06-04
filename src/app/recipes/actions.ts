"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import * as recipeService from "@/domain/recipe/service";
import type { RecipeInsertDB, RecipeUpdateDB } from "@/domain/recipe/types";
import { getServerSupabase } from "@/lib/supabase/server";

function handleError(error: unknown): never {
  if (error instanceof ZodError) {
    const first = error.issues.at(0);
    throw new Error(first?.message ?? "입력값을 확인해 주세요.");
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error("알 수 없는 오류가 발생했습니다.");
}

export async function createRecipeAction(input: RecipeInsertDB) {
  let recipeId: string;
  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      throw new Error("알 수 없는 오류가 발생했습니다.");
    }
    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const recipe = await recipeService.createRecipe(supabase, input);
    recipeId = recipe.id;
  } catch (error) {
    handleError(error);
  }

  revalidatePath("/recipes");
  revalidatePath("/search");
  redirect(`/recipes/${recipeId}`);
}

export async function updateRecipeAction(id: string, patch: RecipeUpdateDB) {
  try {
    const supabase = await getServerSupabase();
    const recipe = await recipeService.updateRecipe(supabase, id, patch);
    revalidatePath(`/recipes/${id}`);
    revalidatePath("/recipes");
    revalidatePath("/search");
    return recipe;
  } catch (error) {
    handleError(error);
  }
}

export async function deleteRecipeAction(id: string) {
  try {
    const supabase = await getServerSupabase();
    await recipeService.removeRecipe(supabase, id);
  } catch (error) {
    handleError(error);
  }

  revalidatePath("/recipes");
  revalidatePath("/search");
  redirect("/recipes");
}
