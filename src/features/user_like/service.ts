// src/features/user_like/service.ts
"use server";
import { isLiked, countLikes, likeOnce } from "./repository";

function assertRecipeId(id: string) {
  if (typeof id !== "string" || id.length < 1) {
    throw new Error("VALIDATION_FAILED: invalid recipeId");
  }
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
