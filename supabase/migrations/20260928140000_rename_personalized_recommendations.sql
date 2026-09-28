-- 맞춤 추천 RPC 이름을 인기 추천(get_popular_recommendations_30d)과 짝이 맞게 바꾼다.
-- 이전 이름은 조회 기록을 다루는 함수처럼 읽혔다. 이름만 바꾸므로 실행 권한과 설명은 그대로 유지된다.
alter function public.recommend_from_view_history(jsonb, text, uuid, text[], integer)
  rename to get_personalized_recommendations;
