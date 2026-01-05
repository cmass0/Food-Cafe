import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import * as userLikeRepo from "./repository";
import { TopRecipe, TopRecipeRow } from "./types";

export function mapTopRecipe(row: TopRecipeRow): TopRecipe {
  return {
    id: row.recipe_id,
    title: row.title,
    summary: row.summary,
    image: row.image,
    likeCount: row.like_count,
    viewCount: row.view_count,
    writerUid: row.writer_uid,
    writerName: row.writer_name,
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
