-- 추천 검색 RPC를 다른 추천 RPC(인기·맞춤)처럼 서버 전용으로 좁힌다.
-- 채팅 API는 서버의 service_role 클라이언트로만 호출하므로, 로그인 사용자의 직접 실행 권한은 쓰이지 않는다.
-- 반환값은 공개 콘텐츠의 ID·순위뿐이지만, 브라우저에서 임의 벡터로 반복 호출할 경로를 남기지 않는다.
revoke execute on function public.search_recommendations(
  text,
  extensions.vector,
  text,
  text[],
  text,
  text,
  integer,
  boolean,
  text[],
  text[],
  integer
) from public, anon, authenticated;
