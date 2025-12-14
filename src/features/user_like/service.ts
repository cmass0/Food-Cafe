import { getUser } from '@/features/user/api';
// src/features/user_like/service.ts
"use server";
import { SupabaseClient } from "@supabase/supabase-js";
import * as userLikeRepo from "./repository";
import { Database } from "@/types/supabase";
import { getServerSupabase } from "@/lib/supabase/server";
import { ToggleRecipeLikeParams } from './types';



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
  return userLikeRepo.fetchLikedRecipeIds(client, user.id, recipeIds);
}

export async function getLikeMeta(recipeId: string) {
  const supabase = getServerSupabase();
  const {data} = await supabase.auth.getUser();
  if (!data.user) throw new Error("UNAUTHENTICATED");
  
  assertRecipeId(recipeId);
  const [liked, count] = await Promise.all([userLikeRepo.isLiked(recipeId, data.user.id), userLikeRepo.countLikes(recipeId)]);
  return { liked, count };
}

export async function toggleRecipeLike(
  client: SupabaseClient<Database>,
  params: ToggleRecipeLikeParams
): Promise<boolean> {
  const { userId, recipeId, currentlyLiked } = params;

  const nextLiked: boolean = !currentlyLiked;

  await userLikeRepo.setRecipeLike(client, {
    userId,
    recipeId,
    like: nextLiked,
  });

  return nextLiked;
}


