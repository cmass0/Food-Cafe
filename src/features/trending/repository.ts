import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";
import type { TrendingComboRow, TrendingPostRow, TrendingRecipeRow, TrendingTagRow } from "./types";

export async function selectTrendingRecipes(
  client: SupabaseClient<Database>,
  limit: number
): Promise<TrendingRecipeRow[]> {
  const { data, error } = await client.rpc("get_trending_recipes_7d", {
    limit_size: limit,
  });

  if (error) throw error;
  return data ?? [];
}

export async function selectTrendingCombos(
  client: SupabaseClient<Database>,
  limit: number
): Promise<TrendingComboRow[]> {
  const { data, error } = await client.rpc("get_trending_combos_7d", {
    limit_size: limit,
  });

  if (error) throw error;
  return data ?? [];
}

export async function selectTrendingPosts(
  client: SupabaseClient<Database>,
  limit: number
): Promise<TrendingPostRow[]> {
  const { data, error } = await client.rpc("get_trending_posts_7d", {
    limit_size: limit,
  });

  if (error) throw error;
  return data ?? [];
}

export async function selectTrendingRecipeTags(
  client: SupabaseClient<Database>,
  limit: number
): Promise<TrendingTagRow[]> {
  const { data, error } = await client.rpc("get_trending_recipe_tags_7d", {
    limit_size: limit,
  });

  if (error) throw error;
  return data ?? [];
}
