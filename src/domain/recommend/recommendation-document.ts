import { createHash } from "node:crypto";

import type {
  PreparedRecommendationDocument,
  RecommendationDocument,
  RecommendationDocumentStatus,
} from "@/domain/recommend/types";
import type { Json } from "@/types/supabase";

import { RECOMMENDATION_EMBEDDING_DIMENSIONS } from "@/lib/ai/embedding-config";
import { formatRecommendationDocumentEmbeddingInput } from "@/lib/ai/embedding-input";

export function prepareRecommendationDocument(
  document: RecommendationDocument,
  modelId: string
): PreparedRecommendationDocument {
  const embeddingInput = formatRecommendationDocumentEmbeddingInput(
    document.title,
    document.searchText,
    modelId
  );
  return {
    ...document,
    embeddingInput,
    contentHash: createHash("sha256").update(embeddingInput).digest("hex"),
  };
}

export function validateRecommendationDocumentEmbedding(embedding: number[]): number[] {
  if (
    embedding.length !== RECOMMENDATION_EMBEDDING_DIMENSIONS ||
    embedding.some((component) => !Number.isFinite(component))
  ) {
    throw new Error(`추천 문서 임베딩은 ${RECOMMENDATION_EMBEDDING_DIMENSIONS}차원이어야 합니다.`);
  }
  return embedding;
}

export function toRecommendationDocumentRpcPayload(
  document: PreparedRecommendationDocument,
  modelId: string,
  status: RecommendationDocumentStatus,
  embedding: number[] | null = null,
  error: string | null = null
): Json {
  return {
    source_type: document.sourceType,
    source_id: document.sourceId,
    search_text: document.searchText,
    embedding: embedding === null ? null : JSON.stringify(embedding),
    category: document.category,
    difficulty: document.difficulty,
    time_minutes: document.timeMinutes,
    tools_required: document.toolsRequired,
    ingredient_names: document.ingredientNames,
    content_hash: document.contentHash,
    embedding_model: modelId,
    embedding_status: status,
    embedding_error: error,
  };
}
