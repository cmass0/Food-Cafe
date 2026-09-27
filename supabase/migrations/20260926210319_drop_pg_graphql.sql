-- 앱은 REST(PostgREST)만 쓰고 GraphQL(/graphql/v1)은 쓰지 않는다.
-- pg_graphql이 켜져 있으면 공개 anon 키만으로 테이블·컬럼 구조를 조회할 수 있으므로 확장을 끈다.
-- 데이터 접근 권한(RLS·컬럼 권한)은 바뀌지 않는다. 다시 필요하면 대시보드에서 켠다.
drop extension if exists pg_graphql;
