import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";

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


