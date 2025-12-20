// src/features/user_bookmark/service.ts
"use server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import * as repo from "./repository";

export async function toggleRecipeBookmark(
  client: SupabaseClient<Database>,
  params: { userId: string; recipeId: string; currentlyBookmarked: boolean }
): Promise<boolean> {
  const next = !params.currentlyBookmarked;
  await repo.setRecipeBookmark(client, { userId: params.userId, recipeId: params.recipeId, bookmark: next });
  return next;
}
