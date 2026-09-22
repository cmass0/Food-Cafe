import "server-only";

import { embed } from "ai";

import type { RecommendationQueryEmbedding } from "@/domain/recommend/types";
import {
  RECOMMENDATION_EMBEDDING_DIMENSIONS,
  RECOMMENDATION_EMBEDDING_PROVIDER_OPTIONS,
} from "@/lib/ai/embedding-config";
import { formatRecommendationQueryEmbeddingInput } from "@/lib/ai/embedding-input";
import { getRecommendEmbeddingModel, getRecommendEmbeddingModelId } from "@/lib/ai/model";

export async function createRecommendationQueryEmbedding(
  query: string
): Promise<RecommendationQueryEmbedding> {
  const value = query.trim();
  if (!value) throw new Error("임베딩할 추천 검색어가 필요합니다.");

  const modelId = getRecommendEmbeddingModelId();
  // 검색 문장도 추천 문서를 만들 때와 같은 모델·차원으로 임베딩해야 벡터 비교가 가능하다.
  // RPC가 modelId와 vector_dims를 다시 검사하므로 다른 모델의 벡터가 조용히 섞이지 않는다.
  const { embedding } = await embed({
    model: getRecommendEmbeddingModel(),
    value: formatRecommendationQueryEmbeddingInput(value, modelId),
    providerOptions: RECOMMENDATION_EMBEDDING_PROVIDER_OPTIONS,
  });

  // 외부 모델이 비정상 응답을 준 경우 잘못된 벡터를 DB까지 전달하지 않는다.
  if (
    embedding.length !== RECOMMENDATION_EMBEDDING_DIMENSIONS ||
    embedding.some((component) => !Number.isFinite(component))
  ) {
    throw new Error(
      `추천 검색어 임베딩은 ${RECOMMENDATION_EMBEDDING_DIMENSIONS}차원이어야 합니다.`
    );
  }

  return { embedding, modelId };
}
