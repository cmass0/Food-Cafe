"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { getServerSupabase } from "@/lib/supabase/server";
import * as recipeService from "@/features/recipe/service";
import type { RecipeInsertInput, RecipeUpdateInput } from "@/features/recipe/types";
import { getLikeMeta, likeOnceForCurrentUser } from "@/features/user_like/service";

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

export async function createRecipeAction(input: RecipeInsertInput) {
  try {
    const supabase = getServerSupabase();
    const recipe = await recipeService.createRecipe(supabase, input);
    revalidatePath("/recipes");
    revalidatePath("/search");
    redirect(`/recipes/${recipe.id}`);
  } catch (error) {
    handleError(error);
  }
}

export async function updateRecipeAction(id: string, patch: RecipeUpdateInput) {
  try {
    const supabase = getServerSupabase();
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
    const supabase = getServerSupabase();
    await recipeService.removeRecipe(supabase, id);
    revalidatePath("/recipes");
    revalidatePath("/search");
    redirect("/recipes");
  } catch (error) {
    handleError(error);
  }
}

export async function likeOnceAction(recipeId: string) {
  const result = await likeOnceForCurrentUser(recipeId);
  revalidatePath("/recipes");
  return result;
}

export async function likeMetaAction(recipeId: string) {
  return getLikeMeta(recipeId);
}

