import { describe, expect, test } from "vitest";

import {
  formatRecommendationDocumentEmbeddingInput,
  formatRecommendationQueryEmbeddingInput,
} from "./embedding-input";

describe("추천 임베딩 입력", () => {
  test.each(["google/gemini-embedding-2", "google/gemini-embedding-2-preview"])(
    "%s 검색 규격에 맞는 query와 document prefix를 사용한다",
    (modelId) => {
      expect(formatRecommendationQueryEmbeddingInput("비 오는 날 음식", modelId)).toBe(
        "task: search result | query: 비 오는 날 음식"
      );
      expect(formatRecommendationDocumentEmbeddingInput("김치전", "바삭한 전", modelId)).toBe(
        "title: 김치전 | text: 바삭한 전"
      );
    }
  );

  test("다른 모델에는 원문을 전달한다", () => {
    expect(
      formatRecommendationQueryEmbeddingInput("간단한 음식", "openai/text-embedding-3-small")
    ).toBe("간단한 음식");
    expect(
      formatRecommendationDocumentEmbeddingInput(
        "계란밥",
        "재료가 적은 한 끼",
        "openai/text-embedding-3-small"
      )
    ).toBe("재료가 적은 한 끼");
  });
});
