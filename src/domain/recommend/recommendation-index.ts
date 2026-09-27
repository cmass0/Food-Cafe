import "server-only";

import { embed } from "ai";

import {
  buildComboRecommendationDocument,
  buildRecipeRecommendationDocument,
} from "@/domain/recommend/document";
import type {
  PreparedRecommendationDocument,
  RecommendationComboDocumentSource,
  RecommendationDocument,
  RecommendationDocumentState,
  RecommendationDocumentStatus,
  RecommendationRecipeDocumentSource,
} from "@/domain/recommend/types";
import { getAdminSupabase } from "@/lib/supabase/admin";

import { RECOMMENDATION_EMBEDDING_PROVIDER_OPTIONS } from "@/lib/ai/embedding-config";
import { getRecommendEmbeddingModel, getRecommendEmbeddingModelId } from "@/lib/ai/model";
import {
  prepareRecommendationDocument,
  toRecommendationDocumentRpcPayload,
  validateRecommendationDocumentEmbedding,
} from "./recommendation-document";

async function saveDocument(
  client: ReturnType<typeof getAdminSupabase>,
  document: PreparedRecommendationDocument,
  modelId: string,
  status: RecommendationDocumentStatus,
  embedding: number[] | null = null,
  error: string | null = null
): Promise<void> {
  const { data, error: rpcError } = await client.rpc("upsert_recommendation_documents", {
    p_documents: [toRecommendationDocumentRpcPayload(document, modelId, status, embedding, error)],
  });

  if (rpcError) throw rpcError;
  if (data !== 1) throw new Error("추천 문서 저장 개수가 일치하지 않습니다.");
}

async function syncDocument(document: RecommendationDocument): Promise<void> {
  const modelId = getRecommendEmbeddingModelId();
  const prepared = prepareRecommendationDocument(document, modelId);
  const client = getAdminSupabase();
  const { data, error } = await client.rpc("get_recommendation_document_states");
  if (error) throw error;

  const current = (data as RecommendationDocumentState[] | null)?.find(
    (state) => state.source_type === document.sourceType && state.source_id === document.sourceId
  );
  if (
    current?.embedding_status === "ready" &&
    current.content_hash === prepared.contentHash &&
    current.embedding_model === modelId
  ) {
    return;
  }

  // 먼저 pending으로 바꿔 오래된 임베딩이 새 본문으로 검색되지 않게 한다.
  // Gateway 오류가 나도 원본 저장을 되돌리지 않고 failed 상태를 남겨 백필로 재시도한다.
  await saveDocument(client, prepared, modelId, "pending");
  try {
    const { embedding } = await embed({
      model: getRecommendEmbeddingModel(),
      value: prepared.embeddingInput,
      providerOptions: RECOMMENDATION_EMBEDDING_PROVIDER_OPTIONS,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(20_000),
    });
    validateRecommendationDocumentEmbedding(embedding);
    await saveDocument(client, prepared, modelId, "ready", embedding);
  } catch (embeddingError) {
    try {
      await saveDocument(
        client,
        prepared,
        modelId,
        "failed",
        null,
        (embeddingError instanceof Error ? embeddingError.message : String(embeddingError)).slice(
          0,
          1000
        )
      );
    } catch (saveError) {
      console.error("추천 문서 실패 상태 저장 오류", saveError);
    }
    throw embeddingError;
  }
}

async function safelySyncDocument(document: RecommendationDocument): Promise<void> {
  try {
    await syncDocument(document);
  } catch (error) {
    // 추천 색인의 외부 서비스 장애가 레시피·조합 원본 저장을 실패로 보이게 하지 않는다.
    console.error(`${document.sourceType} 추천 색인 동기화 실패 (${document.sourceId})`, error);
  }
}

export async function syncRecipeRecommendationDocument(
  source: RecommendationRecipeDocumentSource
): Promise<void> {
  await safelySyncDocument(buildRecipeRecommendationDocument(source));
}

export async function syncComboRecommendationDocument(
  source: RecommendationComboDocumentSource
): Promise<void> {
  await safelySyncDocument(buildComboRecommendationDocument(source));
}
