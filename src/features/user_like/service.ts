// src/features/user_like/service.ts
"use server";
import { SupabaseClient } from "@supabase/supabase-js";
import { isLiked, countLikes, likeOnce, fetchLikedRecipeIds } from "./repository";
import { Database } from "@/types/supabase";

function assertRecipeId(id: string) {
  if (typeof id !== "string" || id.length < 1) {
    throw new Error("VALIDATION_FAILED: invalid recipeId");
  }
}

export async function buildLikedSet(
  client: SupabaseClient<Database>,
  recipeIds: string[],
): Promise<Set<string>> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return new Set();
  return fetchLikedRecipeIds(client, user.id, recipeIds);
}

export async function getLikeMeta(recipeId: string) {
  assertRecipeId(recipeId);
  const [liked, count] = await Promise.all([isLiked(recipeId), countLikes(recipeId)]);
  return { liked, count };
}

export async function likeOnceForCurrentUser(recipeId: string) {
  assertRecipeId(recipeId);
  try {
    return await likeOnce(recipeId); // { liked: true, count }
  } catch (err: any) {
    if (String(err?.message).includes("UNAUTHENTICATED")) {
      throw new Error("AUTH_REQUIRED");
    }
    throw err;
  }
}
