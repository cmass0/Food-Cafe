export const RECOMMENDATION_EMBEDDING_DIMENSIONS = 768;

// 검색 문서와 사용자 검색어가 반드시 같은 좌표계와 차원을 사용하도록 공통 설정으로 관리한다.
export const RECOMMENDATION_EMBEDDING_PROVIDER_OPTIONS = {
  google: {
    outputDimensionality: RECOMMENDATION_EMBEDDING_DIMENSIONS,
  },
};
