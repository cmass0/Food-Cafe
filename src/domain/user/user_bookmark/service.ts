import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import { toggleBookmarkSchema } from "./schema";
import { UserRecipeBookmarkOptions } from "./type";

export async function buildBookmarkedSetRecipe(
  client: SupabaseClient<Database>,
  recipeIds: string[]
): Promise<Set<string>> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return new Set<string>();
  }

  return repo.fetchBookmarkedRecipeIds(client, user.id, recipeIds);
}

export async function toggleRecipeBookmark(
  client: SupabaseClient<Database>,
  params: UserRecipeBookmarkOptions
): Promise<boolean> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("로그인이 필요합니다.");
  if (user.id !== params.userId) throw new Error("사용자 정보가 일치하지 않습니다.");

  const parse = toggleBookmarkSchema.parse(params);

  const next = !params.currentlyBookmarked;
  await repo.setRecipeBookmark(client, {
    userId: parse.userId,
    recipeId: parse.recipeId,
    bookmark: next,
  });
  return next;
}
