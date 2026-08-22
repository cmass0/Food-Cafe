import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";
import type { TrendingPeriod } from "./period";
import type { TrendingComboRow, TrendingPostRow, TrendingRecipeRow, TrendingTagRow } from "./types";

export async function selectTrendingRecipes(
  client: SupabaseClient<Database>,
  limit: number,
  period: TrendingPeriod
): Promise<TrendingRecipeRow[]> {
  const { data, error } = await client.rpc("get_trending_recipes_by_period", {
    limit_size: limit,
    period,
  });

  if (error) throw error;
  return data ?? [];
}

export async function selectTrendingCombos(
  client: SupabaseClient<Database>,
  limit: number,
  period: TrendingPeriod
): Promise<TrendingComboRow[]> {
  const { data, error } = await client.rpc("get_trending_combos_by_period", {
    limit_size: limit,
    period,
  });

  if (error) throw error;
  return data ?? [];
}

export async function selectTrendingPosts(
  client: SupabaseClient<Database>,
  limit: number,
  period: TrendingPeriod
): Promise<TrendingPostRow[]> {
  const { data, error } = await client.rpc("get_trending_posts_by_period", {
    limit_size: limit,
    period,
  });

  if (error) throw error;
  return data ?? [];
}

export async function selectTrendingRecipeTags(
  client: SupabaseClient<Database>,
  limit: number,
  period: TrendingPeriod
): Promise<TrendingTagRow[]> {
  const { data, error } = await client.rpc("get_trending_recipe_tags_by_period", {
    limit_size: limit,
    period,
  });

  if (error) throw error;
  return data ?? [];
}
