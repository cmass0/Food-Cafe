import "server-only";

import { gateway } from "ai";

// 답변 생성 모델과 검색용 임베딩 모델은 역할·가격이 다르므로 환경변수를 분리한다.
// 특히 임베딩 모델 ID는 DB에 저장되며, 모델을 바꾸면 기존 문서를 새 모델로 다시 임베딩해야 한다.
function requireServerEnvironment(name: "AI_RECOMMEND_MODEL" | "AI_RECOMMEND_EMBEDDING_MODEL") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} 환경변수가 필요합니다.`);
  return value;
}

export function getRecommendLanguageModel() {
  return gateway(requireServerEnvironment("AI_RECOMMEND_MODEL"));
}

export function getRecommendEmbeddingModelId(): string {
  return requireServerEnvironment("AI_RECOMMEND_EMBEDDING_MODEL");
}

export function getRecommendEmbeddingModel() {
  // Gateway가 provider/model 형식의 ID를 실제 Google·OpenAI 등의 임베딩 API로 라우팅한다.
  return gateway.embeddingModel(getRecommendEmbeddingModelId());
}
