import { getServerSupabase } from "@/lib/supabase/server";
import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import * as userLikeRepo from "./repository";

function assertRecipeId(id: string) {
  if (typeof id !== "string" || id.length < 1) {
    throw new Error("유효하지 않은 레시피 ID입니다.");
  }
}

export async function buildLikedSet(
  client: SupabaseClient<Database>,
  recipeIds: string[]
): Promise<Set<string>> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("로그인이 필요합니다.");
  return userLikeRepo.fetchLikedRecipeIds(client, user.id, recipeIds);
}

export async function getLikeMeta(recipeId: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("로그인이 필요합니다.");

  assertRecipeId(recipeId);
  const [liked, count] = await Promise.all([
    userLikeRepo.isLiked(recipeId, data.user.id),
    userLikeRepo.countLikes(recipeId),
  ]);
  return { liked, count };
}
