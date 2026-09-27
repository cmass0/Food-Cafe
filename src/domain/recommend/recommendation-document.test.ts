import { describe, expect, test } from "vitest";

import type { RecommendationDocument } from "@/domain/recommend/types";

import {
  prepareRecommendationDocument,
  toRecommendationDocumentRpcPayload,
  validateRecommendationDocumentEmbedding,
} from "./recommendation-document";

const DOCUMENT: RecommendationDocument = {
  sourceType: "recipe",
  sourceId: "00000000-0000-4000-8000-000000000001",
  title: "김치볶음밥",
  searchText: "제목: 김치볶음밥",
  category: "한식",
  difficulty: "쉬움",
  timeMinutes: 15,
  toolsRequired: false,
  ingredientNames: ["김치", "밥"],
};

describe("prepareRecommendationDocument", () => {
  test("Gemini 문서 형식과 내용 해시를 생성한다", () => {
    expect(prepareRecommendationDocument(DOCUMENT, "google/gemini-embedding-2")).toMatchObject({
      embeddingInput: "title: 김치볶음밥 | text: 제목: 김치볶음밥",
      contentHash: "17cc9fcc17dd0886d90187c6ce17d5f2d74482924f3f558533023ce83cf2e1db",
    });
  });

  test("검색 본문이 바뀌면 내용 해시도 바뀐다", () => {
    const before = prepareRecommendationDocument(DOCUMENT, "google/gemini-embedding-2");
    const after = prepareRecommendationDocument(
      { ...DOCUMENT, searchText: "제목: 김치볶음밥\n재료: 김치, 밥" },
      "google/gemini-embedding-2"
    );

    expect(after.contentHash).not.toBe(before.contentHash);
  });
});

describe("validateRecommendationDocumentEmbedding", () => {
  test("768차원의 유한한 벡터를 허용한다", () => {
    const embedding = Array(768).fill(0);
    expect(validateRecommendationDocumentEmbedding(embedding)).toEqual(embedding);
  });

  test.each([
    ["빈 벡터", []],
    ["767차원", Array(767).fill(0)],
    ["769차원", Array(769).fill(0)],
    ["NaN 성분", [Number.NaN, ...Array(767).fill(0)]],
    ["무한대 성분", [Number.POSITIVE_INFINITY, ...Array(767).fill(0)]],
  ] as const)("%s은 거부한다", (_label, embedding) => {
    expect(() => validateRecommendationDocumentEmbedding([...embedding])).toThrow(
      "추천 문서 임베딩은 768차원이어야 합니다."
    );
  });
});

describe("toRecommendationDocumentRpcPayload", () => {
  const prepared = prepareRecommendationDocument(DOCUMENT, "google/gemini-embedding-2");

  test("대기 상태에서는 검색 벡터를 비우고 원본 ID와 해시를 보존한다", () => {
    expect(
      toRecommendationDocumentRpcPayload(prepared, "google/gemini-embedding-2", "pending")
    ).toEqual({
      source_type: "recipe",
      source_id: DOCUMENT.sourceId,
      search_text: DOCUMENT.searchText,
      embedding: null,
      category: "한식",
      difficulty: "쉬움",
      time_minutes: 15,
      tools_required: false,
      ingredient_names: ["김치", "밥"],
      content_hash: prepared.contentHash,
      embedding_model: "google/gemini-embedding-2",
      embedding_status: "pending",
      embedding_error: null,
    });
  });

  test("완료 상태의 벡터를 RPC가 받는 문자열로 변환한다", () => {
    expect(
      toRecommendationDocumentRpcPayload(prepared, "google/gemini-embedding-2", "ready", [0, 1])
    ).toMatchObject({ embedding: "[0,1]", embedding_status: "ready" });
  });
});
