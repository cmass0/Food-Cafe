import type { SupabaseClient } from "@supabase/supabase-js";

import { toArrayItems } from "@/domain/combo/normalization";
import { normaliseTextArray, toArrayIngredient } from "@/domain/recipe/normalization";
import type { Database } from "@/types/supabase";
import * as repository from "./repository";
import {
  recommendationSearchSchema,
  RECOMMENDATION_MATCH_COUNT,
  recommendRecipeSearchSchema,
  type RecommendationSearchInput,
  type RecommendRecipeSearchInput,
} from "./schema";
import type {
  RecommendComboRow,
  RecommendRecipeCandidate,
  RecommendRecipeRow,
  RecommendRecipeSearchResult,
  RecommendationCandidate,
  RecommendationComboCandidate,
  RecommendationQueryEmbedding,
  RecommendationRank,
  RecommendationSearchResult,
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


function toCandidateRank(
  rank: RecommendationRank
): Omit<RecommendationRank, "sourceType" | "sourceId"> {
  return {
    score: rank.score,
    keywordRank: rank.keywordRank,
    semanticRank: rank.semanticRank,
    semanticSimilarity: rank.semanticSimilarity,
  };
}

export function mapRecommendComboRow(
  row: RecommendComboRow,
  rank: RecommendationRank
): RecommendationComboCandidate {
  const items = toArrayItems(row.items);

  return {
    sourceType: "combo",
    id: row.id,
    title: row.title,
    summary: row.summary ?? null,
    items,
    itemCount: items.length,
    tags: normaliseTextArray(row.tags),
    tools: normaliseTextArray(row.tools),
    toolsRequired: row.tools_required ?? false,
    difficulty: row.difficulty ?? null,
    timeMinutes: row.time_minutes ?? null,
    likeCount: row.like_count,
    bookmarkCount: row.bookmark_count,
    commentCount: row.comment_count,
    viewCount: row.view_count,
    rank: toCandidateRank(rank),
  };
}

export async function searchRecommendations(
  client: SupabaseClient<Database>,
  input: RecommendationSearchInput,
  queryEmbedding: RecommendationQueryEmbedding
): Promise<RecommendationSearchResult> {
  const parsed = recommendationSearchSchema.parse(input);
  const ranks = await repository.selectRecommendationRanks(
    client,
    parsed,
    queryEmbedding,
    RECOMMENDATION_MATCH_COUNT
  );

  // PostgREST의 in(...) 결과 순서는 RPC 순위와 같다는 보장이 없으므로, 먼저 원본을 Map으로
  // 만든 다음 아래에서 ranks를 순회하며 하이브리드 검색 순서를 복원한다.
  const recipeIds = ranks
    .filter((rank) => rank.sourceType === "recipe")
    .map((rank) => rank.sourceId);
  const comboIds = ranks.filter((rank) => rank.sourceType === "combo").map((rank) => rank.sourceId);
  const [recipeRows, comboRows] = await Promise.all([
    repository.selectRecommendRecipeRowsByIds(client, recipeIds),
    repository.selectRecommendComboRowsByIds(client, comboIds),
  ]);
  const recipesById = new Map(recipeRows.map((row) => [row.id, row]));
  const combosById = new Map(comboRows.map((row) => [row.id, row]));

  const items = ranks.flatMap<RecommendationCandidate>((rank) => {
    if (rank.sourceType === "recipe") {
      const row = recipesById.get(rank.sourceId);
      // RPC 실행과 원본 재조회 사이에 삭제되거나 RLS로 가려진 콘텐츠는 조용히 제외한다.
      if (!row) return [];
      return [
        {
          ...mapRecommendRecipeRow(row),
          sourceType: "recipe",
          rank: toCandidateRank(rank),
        },
      ];
    }

    const row = combosById.get(rank.sourceId);
    return row ? [mapRecommendComboRow(row, rank)] : [];
  });

  return {
    items,
    query: parsed.query,
    appliedFilters: {
      sourceTypes: parsed.sourceTypes,
      category: parsed.category ?? null,
      difficulty: parsed.difficulty ?? null,
      maxTimeMinutes: parsed.maxTimeMinutes ?? null,
      toolsRequired: parsed.toolsRequired ?? null,
      includeIngredients: parsed.includeIngredients,
      excludeIngredients: parsed.excludeIngredients,
    },
  };
}
