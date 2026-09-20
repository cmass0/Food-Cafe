import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeSearchTerm } from "@/lib/domain/repo/querypattern";
import type { Database } from "@/types/supabase";
import type { RecommendRecipeRow, RecommendRecipeSearch } from "./types";

const RECOMMEND_RECIPE_COLUMNS = `
  id,
  title,
  summary,
  category,
  tags,
  tools,
  tools_required,
  difficulty,
  time_minutes,
  servings,
  ingredients,
  like_count,
  bookmark_count,
  comment_count,
  view_count,
  created_at
` as const;

export async function selectRecommendRecipeRows(
  client: SupabaseClient<Database>,
  params: RecommendRecipeSearch
): Promise<RecommendRecipeRow[]> {
  let query = client.from("recipes").select(RECOMMEND_RECIPE_COLUMNS);
  const search = normalizeSearchTerm(params.query);

  if (params.query.length > 0 && !search) return [];
  if (search) {
    query = query.textSearch("tsv", search, { type: "websearch", config: "simple" });
  }

  if (params.maxTimeMinutes !== undefined) {
    query = query.lte("time_minutes", params.maxTimeMinutes);
  }

  for (const ingredient of params.ingredients) {
    query = query.contains("ingredients", [{ name: ingredient }]);
  }

  if (params.sort === "recent") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query
      .order("like_count", { ascending: false })
      .order("bookmark_count", { ascending: false })
      .order("view_count", { ascending: false })
      .order("created_at", { ascending: false });
  }

  const { data, error } = await query.order("id", { ascending: true }).limit(params.limit);
  if (error) throw error;
  return (data ?? []) as RecommendRecipeRow[];
}
