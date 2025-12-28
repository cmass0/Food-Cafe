import { getServerSupabase } from "@/lib/supabase/server";
import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import * as userLikeRepo from "./repository";
import { TopRecipe } from "./types";

export function mapTopRecipe(row: TopRecipe): TopRecipe {
  return {
    recipeId: row.recipeId,
    title: row.title,
    summary: row.summary,
    image: row.image,
    likeCount: row.likeCount,
    viewCount: row.viewCount,
    writerUid: row.writerUid,
    writerName: row.writerName,
  };
}

export async function buildLikedSetRecipe(
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

  const [liked, count] = await Promise.all([
    userLikeRepo.isLikedRecipe(supabase, recipeId, data.user.id),
    userLikeRepo.countLikesRecipe(supabase, recipeId),
  ]);
  return { liked, count };
}
