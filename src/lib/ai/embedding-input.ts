function isGeminiEmbedding2(modelId: string): boolean {
  return modelId === "google/gemini-embedding-2" || modelId === "google/gemini-embedding-2-preview";
}

// Gemini Embedding 2는 taskType 옵션 대신 검색어와 문서에 서로 다른 공식 prefix를 요구한다.
export function formatRecommendationQueryEmbeddingInput(query: string, modelId: string): string {
  return isGeminiEmbedding2(modelId) ? `task: search result | query: ${query}` : query;
}

export function formatRecommendationDocumentEmbeddingInput(
  title: string,
  searchText: string,
  modelId: string
): string {
  return isGeminiEmbedding2(modelId) ? `title: ${title} | text: ${searchText}` : searchText;
}
