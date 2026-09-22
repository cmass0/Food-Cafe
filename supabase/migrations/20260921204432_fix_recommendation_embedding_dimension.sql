-- Gemini Embedding 2의 권장 축소 차원과 애플리케이션 설정을 일치시킨다.
-- 현재 추천 문서가 비어 있으므로 기존 벡터 변환 없이 안전하게 타입을 고정할 수 있다.
alter table private.recommendation_documents
  alter column embedding type extensions.vector(768)
  using embedding::extensions.vector(768);

comment on column private.recommendation_documents.embedding is
  '레시피·콤보와 사용자 검색어에 공통으로 사용하는 768차원 임베딩 벡터다.';
