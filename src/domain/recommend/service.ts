import type { SupabaseClient } from "@supabase/supabase-js";

import { normaliseTextArray, toArrayIngredient } from "@/domain/recipe/normalization";
import type { Database } from "@/types/supabase";
import * as repository from "./repository";
import { recommendRecipeSearchSchema, type RecommendRecipeSearchInput } from "./schema";
import type {
  RecommendRecipeCandidate,
  RecommendRecipeRow,
  RecommendRecipeSearchResult,
} from "./types";

export function mapRecommendRecipeRow(row: RecommendRecipeRow): RecommendRecipeCandidate {
  const ingredients = toArrayIngredient(row.ingredients);

  return {
    id: row.id,
    title: row.title,
    summary: row.summary ?? null,
    category: row.category ?? null,
    tags: normaliseTextArray(row.tags),
    tools: normaliseTextArray(row.tools),
    toolsRequired: row.tools_required ?? false,
    difficulty: row.difficulty ?? null,
    timeMinutes: row.time_minutes ?? null,
    servings: row.servings ?? null,
    ingredients,
    ingredientCount: ingredients.length,
    likeCount: row.like_count,
    bookmarkCount: row.bookmark_count,
    commentCount: row.comment_count,
    viewCount: row.view_count,
  };
}

export async function searchRecommendRecipes(
  client: SupabaseClient<Database>,
  input: RecommendRecipeSearchInput
): Promise<RecommendRecipeSearchResult> {
  const parsed = recommendRecipeSearchSchema.parse(input);
  const rows = await repository.selectRecommendRecipeRows(client, parsed);

  return {
    items: rows.map(mapRecommendRecipeRow),
    query: parsed.query,
    appliedIngredients: parsed.ingredients,
  };
}
