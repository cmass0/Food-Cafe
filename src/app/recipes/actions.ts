"use server";

import * as recipeService from "@/domain/recipe/service";
import type { RecipeInsertDB, RecipeUpdateDB } from "@/domain/recipe/types";
import { deriveDisplayName } from "@/domain/user/lib/displayName";
import { requireAuthContext } from "@/lib/auth/session";
import { safeDiscardFailedUploads } from "@/lib/storage/server";
import { storagePrefix } from "@/lib/storage/paths";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

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

export async function createRecipeAction(input: RecipeInsertDB, uploadedPaths: string[] = []) {
  let recipeId: string;
  let userId: string | null = null;
  try {
    const { supabase, user } = await requireAuthContext();
    userId = user.id;
    const recipe = await recipeService.createRecipe(supabase, {
      ...input,
      writer_uid: user.id,
      writer_name: deriveDisplayName(user) ?? user.email ?? "user",
      writer_email: user.email ?? undefined,
    });
    recipeId = recipe.id;
  } catch (error) {
    if (userId && input.id) {
      await safeDiscardFailedUploads(
        userId,
        storagePrefix("recipes", userId, input.id),
        uploadedPaths
      );
    }
    handleError(error);
  }

  revalidatePath("/recipes");
  revalidatePath("/search");
  redirect(`/recipes/${recipeId}`);
}

export async function updateRecipeAction(
  id: string,
  patch: RecipeUpdateDB,
  uploadedPaths: string[] = []
) {
  let userId: string | null = null;
  let persisted = false;
  try {
    const { supabase, user } = await requireAuthContext();
    userId = user.id;
    const recipe = await recipeService.updateRecipe(supabase, id, user.id, patch);
    if (!recipe) throw new Error("수정할 수 있는 레시피를 찾지 못했습니다.");
    persisted = true;
    revalidatePath(`/recipes/${id}`);
    revalidatePath("/recipes");
    revalidatePath("/search");
    return recipe;
  } catch (error) {
    if (userId && !persisted) {
      await safeDiscardFailedUploads(userId, storagePrefix("recipes", userId, id), uploadedPaths);
    }
    handleError(error);
  }
}

export async function deleteRecipeAction(id: string) {
  try {
    const { supabase } = await requireAuthContext();
    const deleted = await recipeService.removeRecipe(supabase, id);
    if (!deleted) throw new Error("삭제할 수 있는 레시피를 찾지 못했습니다.");
  } catch (error) {
    handleError(error);
  }

  revalidatePath("/recipes");
  revalidatePath("/search");
  redirect("/recipes");
}
