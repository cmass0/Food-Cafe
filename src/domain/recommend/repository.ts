import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeSearchTerm } from "@/lib/domain/repo/querypattern";
import type { Database } from "@/types/supabase";
import type {
  PopularRecipeCardRow,
  RecommendComboRow,
  RecommendRecipeRow,
  RecommendRecipeSearch,
  RecommendationQueryEmbedding,
  RecommendationRank,
  RecommendationSearch,
} from "./types";

export async function selectPopularRecipeIds(
  client: SupabaseClient<Database>,
  limit: number
): Promise<string[]> {
  const { data, error } = await client.rpc("get_popular_recipes_30d", { p_limit: limit });
  if (error) throw error;

  return (data ?? []).map((row) => row.recipe_id);
}

export async function selectPopularRecipeCardRows(
  client: SupabaseClient<Database>,
  ids: string[]
): Promise<PopularRecipeCardRow[]> {
  if (ids.length === 0) return [];

  // 집계는 서버 전용이지만 화면 데이터는 호출자의 RLS를 적용받는 원본에서 재조회한다.
  const { data, error } = await client.from("recipes").select("id,title,summary").in("id", ids);
  if (error) throw error;
  return data ?? [];
}

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

const RECOMMEND_COMBO_COLUMNS = `
  id,
  title,
  summary,
  items,
  tags,
  tools,
  tools_required,
  difficulty,
  time_minutes,
  like_count,
  bookmark_count,
  comment_count,
  view_count
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

  // 인기순은 좋아요·북마크만 반영한다. 조회수는 누구나 반복 요청으로 늘릴 수 있어 순위에 쓰지 않는다.
  if (params.sort === "recent") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query
      .order("like_count", { ascending: false })
      .order("bookmark_count", { ascending: false })
      .order("created_at", { ascending: false });
  }

  const { data, error } = await query.order("id", { ascending: true }).limit(params.limit);
  if (error) throw error;
  return (data ?? []) as RecommendRecipeRow[];
}

export async function selectRecommendationRanks(
  client: SupabaseClient<Database>,
  params: RecommendationSearch,
  queryEmbedding: RecommendationQueryEmbedding,
  matchCount: number
): Promise<RecommendationRank[]> {
  // private 추천 문서를 직접 노출하지 않고, 공개 RPC가 ID와 검색 순위만 반환한다.
  const { data, error } = await client.rpc("search_recommendations", {
    p_query_text: params.query,
    p_query_embedding: queryEmbedding.embedding,
    // 저장 문서와 다른 모델로 만든 벡터는 같은 공간의 좌표가 아니므로 RPC에서 제외한다.
    p_embedding_model_id: queryEmbedding.modelId,
    p_source_types: params.sourceTypes,
    p_category: params.category ?? null,
    p_difficulty: params.difficulty ?? null,
    p_max_time_minutes: params.maxTimeMinutes ?? null,
    p_tools_required: params.toolsRequired ?? null,
    p_include_ingredients: params.includeIngredients,
    p_exclude_ingredients: params.excludeIngredients,
    p_match_count: matchCount,
  });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    sourceType: row.source_type,
    sourceId: row.source_id,
    score: row.score,
    keywordRank: row.keyword_rank,
    semanticRank: row.semantic_rank,
    semanticSimilarity: row.semantic_similarity,
  }));
}

export async function incrementRecommendationCounts(
  client: SupabaseClient<Database>,
  recipeIds: string[],
  comboIds: string[]
): Promise<void> {
  // 읽고 더해서 다시 쓰지 않고 RPC 안의 on conflict로 증가시켜 동시 추천에서도 누락이 없다.
  const { error } = await client.rpc("increment_recommendation_counts", {
    p_recipe_ids: recipeIds,
    p_combo_ids: comboIds,
  });

  if (error) throw error;
}

export async function selectRecommendRecipeRowsByIds(
  client: SupabaseClient<Database>,
  ids: string[]
): Promise<RecommendRecipeRow[]> {
  if (ids.length === 0) return [];

  // 추천 인덱스는 검색용 파생 데이터일 뿐이다. 사용자에게 보여줄 값은 현재 세션의 RLS를
  // 적용받는 public 원본 테이블에서 다시 읽어 삭제·비공개 처리된 콘텐츠가 노출되지 않게 한다.
  const { data, error } = await client
    .from("recipes")
    .select(RECOMMEND_RECIPE_COLUMNS)
    .in("id", ids);

  if (error) throw error;
  return (data ?? []) as RecommendRecipeRow[];
}

export async function selectRecommendComboRowsByIds(
  client: SupabaseClient<Database>,
  ids: string[]
): Promise<RecommendComboRow[]> {
  if (ids.length === 0) return [];

  // recipes와 같은 이유로 콤보도 검색 인덱스의 복사본이 아니라 원본 테이블에서 재조회한다.
  const { data, error } = await client.from("combos").select(RECOMMEND_COMBO_COLUMNS).in("id", ids);

  if (error) throw error;
  return (data ?? []) as RecommendComboRow[];
}
