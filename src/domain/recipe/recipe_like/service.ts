import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import * as userLikeRepo from "./repository";

// 로그인 확인은 호출하는 쪽에서 한 번만 하고 사용자 ID를 넘긴다. 목록 한 번에 인증 서버를 여러 번 부르지 않는다.
export async function buildLikedSetRecipe(
  client: SupabaseClient<Database>,
  userId: string,
  recipeIds: string[]
): Promise<Set<string>> {
  return userLikeRepo.fetchLikedRecipeIds(client, userId, recipeIds);
}

export async function isLikedRecipe(
  client: SupabaseClient<Database>,
  recipeId: string,
  userId: string
): Promise<boolean> {
  return userLikeRepo.isLikedRecipe(client, recipeId, userId);
}
