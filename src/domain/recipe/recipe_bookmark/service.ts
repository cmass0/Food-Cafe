import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";

// 로그인 확인은 호출하는 쪽에서 한 번만 하고 사용자 ID를 넘긴다. 목록 한 번에 인증 서버를 여러 번 부르지 않는다.
export async function buildBookmarkedSetRecipe(
  client: SupabaseClient<Database>,
  userId: string,
  recipeIds: string[]
): Promise<Set<string>> {
  return repo.fetchBookmarkedRecipeIds(client, userId, recipeIds);
}

export async function isBookmarkedRecipe(
  client: SupabaseClient<Database>,
  userId: string,
  recipeId: string
): Promise<boolean> {
  const bookmarkedSet = await repo.fetchBookmarkedRecipeIds(client, userId, [recipeId]);
  return bookmarkedSet.has(recipeId);
}
