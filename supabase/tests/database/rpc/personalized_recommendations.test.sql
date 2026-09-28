begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(36);

-- 구조: 서버 전용 읽기 함수다.
select extensions.ok(
  not has_function_privilege('anon', 'public.get_personalized_recommendations(jsonb, text, uuid, text[], integer)', 'execute'),
  '익명 사용자는 맞춤 추천 RPC를 직접 실행할 수 없다'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'public.get_personalized_recommendations(jsonb, text, uuid, text[], integer)', 'execute'),
  '로그인 사용자도 맞춤 추천 RPC를 직접 실행할 수 없다(사용자 ID는 서버가 넘긴다)'
);
select extensions.ok(
  has_function_privilege('service_role', 'public.get_personalized_recommendations(jsonb, text, uuid, text[], integer)', 'execute'),
  '서버의 service_role은 맞춤 추천 RPC를 실행할 수 있다'
);
select extensions.ok(
  (
    select not fn.prosecdef and fn.provolatile = 's' and fn.proconfig = array['search_path=""']
    from pg_proc as fn
    where fn.oid = 'public.get_personalized_recommendations(jsonb, text, uuid, text[], integer)'::regprocedure
  ),
  '맞춤 추천 RPC는 security invoker, stable, 빈 search_path다'
);
select extensions.ok(
  obj_description('public.get_personalized_recommendations(jsonb, text, uuid, text[], integer)'::regprocedure, 'pg_proc') is not null,
  '맞춤 추천 RPC에는 설명(comment)이 있다'
);
select extensions.hasnt_function(
  'public',
  'recommend_from_view_history',
  array['jsonb', 'text', 'uuid', 'text[]', 'integer'],
  '이름을 바꾸기 전 함수는 남아 있지 않다'
);

set local role anon;
select extensions.throws_ok(
  $$select * from public.get_personalized_recommendations('[]'::jsonb, 'test-model-view-history')$$,
  '42501',
  null,
  '익명 실행은 실제로 권한 오류가 난다'
);
reset role;

set local role authenticated;
select extensions.throws_ok(
  $$select * from public.get_personalized_recommendations('[]'::jsonb, 'test-model-view-history')$$,
  '42501',
  null,
  '로그인 사용자 실행도 실제로 권한 오류가 난다'
);
reset role;

-- 로컬 테스트 DB에서만 실행한다. 모든 변경은 끝에서 롤백한다.
-- 합성 벡터: 주축 하나(1.0)와 세부 축 하나(0.3)만 값이 있는 768차원 단위 벡터.
create function pg_temp.test_vector(p_axis integer, p_detail_axis integer, p_detail real)
returns extensions.vector
language sql
immutable
as $$
  select extensions.l2_normalize(
    array(
      select case
        when dim = p_axis then 1::real
        when dim = p_detail_axis then p_detail
        else 0::real
      end
      from generate_series(1, 768) as dim
      order by dim
    )::extensions.vector
  )
$$;

insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at
)
values (
  '95000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
  'view-history-user@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
  '{"display_name":"맞춤 추천 사용자"}', now(), now(), now()
);

-- 좋아요·북마크 대상이 되는 레시피 원본(A1, B1).
insert into public.recipes (id, title, image, steps, ingredients, writer_uid)
values
  ('95100000-0000-4000-8000-0000000000a1', '맞춤 추천 A1', 'recipes/test/vh-a1.jpg', '[]', '[]', '95000000-0000-4000-8000-000000000001'),
  ('95100000-0000-4000-8000-0000000000b1', '맞춤 추천 B1', 'recipes/test/vh-b1.jpg', '[]', '[]', '95000000-0000-4000-8000-000000000001');

-- 무리 A(축 1)와 B(축 2)는 세부 축까지 거울처럼 대칭이다. 무리 C(축 3)는 둘과 떨어져 있다.
insert into private.recommendation_documents
  (source_type, source_id, search_text, embedding, content_hash, embedding_model, embedding_status, embedded_at)
values
  ('recipe', '95100000-0000-4000-8000-0000000000a1', '맞춤 추천 A1', pg_temp.test_vector(1, 10, 0.3), 'vh', 'test-model-view-history', 'ready', now()),
  ('recipe', '95100000-0000-4000-8000-0000000000a2', '맞춤 추천 A2', pg_temp.test_vector(1, 11, 0.3), 'vh', 'test-model-view-history', 'ready', now()),
  ('combo',  '95100000-0000-4000-8000-0000000000a3', '맞춤 추천 A3', pg_temp.test_vector(1, 12, 0.3), 'vh', 'test-model-view-history', 'ready', now()),
  ('recipe', '95100000-0000-4000-8000-0000000000b1', '맞춤 추천 B1', pg_temp.test_vector(2, 10, 0.3), 'vh', 'test-model-view-history', 'ready', now()),
  ('recipe', '95100000-0000-4000-8000-0000000000b2', '맞춤 추천 B2', pg_temp.test_vector(2, 11, 0.3), 'vh', 'test-model-view-history', 'ready', now()),
  ('combo',  '95100000-0000-4000-8000-0000000000b3', '맞춤 추천 B3', pg_temp.test_vector(2, 12, 0.3), 'vh', 'test-model-view-history', 'ready', now()),
  ('recipe', '95100000-0000-4000-8000-0000000000c1', '맞춤 추천 C1', pg_temp.test_vector(3, 10, 0.3), 'vh', 'test-model-view-history', 'ready', now()),
  ('combo',  '95100000-0000-4000-8000-0000000000c2', '맞춤 추천 C2', pg_temp.test_vector(3, 12, 0.3), 'vh', 'test-model-view-history', 'ready', now());

-- 결과 개수 상한 검사용: 다른 모델로 만든 25개 문서.
insert into private.recommendation_documents
  (source_type, source_id, search_text, embedding, content_hash, embedding_model, embedding_status, embedded_at)
select
  'recipe',
  ('95200000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid,
  '상한 검사 ' || n,
  pg_temp.test_vector(n, 700, 0.3),
  'vh',
  'test-model-clamp',
  'ready',
  now()
from generate_series(1, 25) as n;

-- 중심화 검사용: 모든 문서가 큰 공통 성분(축 50)을 가진다.
-- 평균을 빼지 않은 코사인은 공통 성분이 큰 Y(0.900)가 고유 성분 a1을 공유한 X(0.894)보다 높다.
insert into private.recommendation_documents
  (source_type, source_id, search_text, embedding, content_hash, embedding_model, embedding_status, embedded_at)
values
  ('recipe', '95300000-0000-4000-8000-000000000001', '중심화 Q', pg_temp.test_vector(50, 1, 0.3333), 'vh', 'test-model-centering', 'ready', now()),
  ('recipe', '95300000-0000-4000-8000-000000000002', '중심화 X', pg_temp.test_vector(50, 1, 1.0), 'vh', 'test-model-centering', 'ready', now()),
  ('recipe', '95300000-0000-4000-8000-000000000003', '중심화 Y', pg_temp.test_vector(50, 2, 0.3333), 'vh', 'test-model-centering', 'ready', now()),
  ('recipe', '95300000-0000-4000-8000-000000000004', '중심화 Z', pg_temp.test_vector(50, 3, 0.3333), 'vh', 'test-model-centering', 'ready', now()),
  ('recipe', '95300000-0000-4000-8000-000000000005', '중심화 W', pg_temp.test_vector(50, 4, 0.3333), 'vh', 'test-model-centering', 'ready', now());

insert into public.recipe_likes (user_id, recipe_id)
values ('95000000-0000-4000-8000-000000000001', '95100000-0000-4000-8000-0000000000b1');

-- 호출 전후로 관계·문서 행이 그대로인지 비교할 기준값.
create temp table view_history_row_counts as
select
  (select count(*) from public.recipe_likes) as likes,
  (select count(*) from public.recipe_bookmarks) as bookmarks,
  (select count(*) from private.recommendation_documents) as documents;

set local role service_role;
select extensions.lives_ok(
  $$select * from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1"}]'::jsonb,
    'test-model-view-history'
  )$$,
  '서버 역할은 private 추천 문서와 좋아요·북마크를 읽어 RPC를 실행할 수 있다'
);
reset role;

-- 동작: 본 항목과 같은 무리가 위로 오고, 본 항목은 제외한다.
select extensions.set_eq(
  $$select source_type, source_id from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1"}]'::jsonb,
    'test-model-view-history', null, array['recipe', 'combo'], 2
  )$$,
  $$values ('recipe', '95100000-0000-4000-8000-0000000000a2'::uuid), ('combo', '95100000-0000-4000-8000-0000000000a3'::uuid)$$,
  'A1을 보면 같은 무리의 레시피 A2와 조합 A3를 추천한다'
);

select extensions.is(
  (
    select count(*)::integer
    from public.get_personalized_recommendations(
      '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1"},
        {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a2"}]'::jsonb,
      'test-model-view-history', null, array['recipe', 'combo'], 20
    ) as result
    where result.source_id in ('95100000-0000-4000-8000-0000000000a1', '95100000-0000-4000-8000-0000000000a2')
  ),
  0,
  '이미 본 항목은 결과에 나오지 않는다'
);

select extensions.results_eq(
  $$select source_id from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"95300000-0000-4000-8000-000000000001"}]'::jsonb,
    'test-model-centering', null, array['recipe'], 1
  )$$,
  $$values ('95300000-0000-4000-8000-000000000002'::uuid)$$,
  '문서 평균을 빼고 비교해 공통 성분이 큰 Y보다 고유 성분을 공유한 X를 먼저 추천한다'
);

-- 가중치: 좋아요는 서버가 넘긴 사용자일 때만 반영한다(B1 좋아요가 이미 있다).
select extensions.is(
  (
    select round(result.similarity::numeric, 6)
    from public.get_personalized_recommendations(
      '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1"},
        {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000b1"}]'::jsonb,
      'test-model-view-history', null, array['recipe', 'combo'], 20
    ) as result
    where result.source_id = '95100000-0000-4000-8000-0000000000a2'
  ),
  (
    select round(result.similarity::numeric, 6)
    from public.get_personalized_recommendations(
      '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1"},
        {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000b1"}]'::jsonb,
      'test-model-view-history', null, array['recipe', 'combo'], 20
    ) as result
    where result.source_id = '95100000-0000-4000-8000-0000000000b2'
  ),
  '사용자 ID가 없으면 좋아요를 무시해 대칭인 A2와 B2의 유사도가 같다'
);

select extensions.set_eq(
  $$select source_type, source_id from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1"},
      {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000b1"}]'::jsonb,
    'test-model-view-history', '95000000-0000-4000-8000-000000000001', array['recipe', 'combo'], 2
  )$$,
  $$values ('recipe', '95100000-0000-4000-8000-0000000000b2'::uuid), ('combo', '95100000-0000-4000-8000-0000000000b3'::uuid)$$,
  '좋아요한 B1(가중치 2)이 A1(1)보다 크게 반영돼 B 무리를 추천한다'
);

insert into public.recipe_bookmarks (user_id, recipe_id)
values ('95000000-0000-4000-8000-000000000001', '95100000-0000-4000-8000-0000000000a1');

select extensions.set_eq(
  $$select source_type, source_id from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1"},
      {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000b1"}]'::jsonb,
    'test-model-view-history', '95000000-0000-4000-8000-000000000001', array['recipe', 'combo'], 2
  )$$,
  $$values ('recipe', '95100000-0000-4000-8000-0000000000a2'::uuid), ('combo', '95100000-0000-4000-8000-0000000000a3'::uuid)$$,
  '북마크한 A1(가중치 2.5)이 좋아요한 B1(2)보다 크게 반영된다'
);

select extensions.set_eq(
  $$select source_type, source_id from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1","viewCount":1},
      {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000b1","viewCount":4}]'::jsonb,
    'test-model-view-history', null, array['recipe', 'combo'], 2
  )$$,
  $$values ('recipe', '95100000-0000-4000-8000-0000000000b2'::uuid), ('combo', '95100000-0000-4000-8000-0000000000b3'::uuid)$$,
  '4번 본 B1(가중치 2.5)이 1번 본 A1(1)보다 크게 반영된다'
);

select extensions.results_eq(
  $$select source_id, round(similarity::numeric, 6) from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1","viewCount":1},
      {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000b1","viewCount":9}]'::jsonb,
    'test-model-view-history', null, array['recipe', 'combo'], 20
  )$$,
  $$select source_id, round(similarity::numeric, 6) from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1","viewCount":1},
      {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000b1","viewCount":4}]'::jsonb,
    'test-model-view-history', null, array['recipe', 'combo'], 20
  )$$,
  '재방문 가산은 +1.5에서 멈춰 9번 본 것과 4번 본 것의 결과가 같다'
);

select extensions.results_eq(
  $$select source_id, round(similarity::numeric, 6) from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1","viewCount":0},
      {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000b1"},
      {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000c1","viewCount":null}]'::jsonb,
    'test-model-view-history', null, array['recipe', 'combo'], 20
  )$$,
  $$select source_id, round(similarity::numeric, 6) from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1","viewCount":1},
      {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000b1","viewCount":1},
      {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000c1","viewCount":1}]'::jsonb,
    'test-model-view-history', null, array['recipe', 'combo'], 20
  )$$,
  '본 횟수가 0이거나 없거나 null이면 1번 본 것으로 계산한다'
);

select extensions.results_eq(
  $$select source_id, round(similarity::numeric, 6) from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1","viewCount":1},
      {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1","viewCount":3},
      {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000b1","viewCount":1}]'::jsonb,
    'test-model-view-history', null, array['recipe', 'combo'], 20
  )$$,
  $$select source_id, round(similarity::numeric, 6) from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1","viewCount":3},
      {"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000b1","viewCount":1}]'::jsonb,
    'test-model-view-history', null, array['recipe', 'combo'], 20
  )$$,
  '같은 항목이 여러 번 오면 본 횟수가 큰 쪽 하나로 합친다'
);

select extensions.ok(
  (
    select count(*) > 0 and count(*) filter (where result.source_type = 'combo') = 0
    from public.get_personalized_recommendations(
      '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1"}]'::jsonb,
      'test-model-view-history', null, array['recipe'], 20
    ) as result
  ),
  '추천 종류를 레시피로 제한하면 조합은 나오지 않는다'
);

-- 비어 있는 결과.
select extensions.is(
  (
    select count(*)::integer from public.get_personalized_recommendations(
      '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1"}]'::jsonb,
      'no-such-model'
    )
  ),
  0,
  '다른 임베딩 모델의 문서와는 섞지 않아 결과가 없다'
);
select extensions.is(
  (
    select count(*)::integer from public.get_personalized_recommendations(
      '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000ff"}]'::jsonb,
      'test-model-view-history'
    )
  ),
  0,
  '추천 문서가 없는 항목만 보면 결과가 없다'
);
select extensions.is(
  (select count(*)::integer from public.get_personalized_recommendations('[]'::jsonb, 'test-model-view-history')),
  0,
  '조회 기록이 비어 있으면 결과가 없다'
);

-- 잘못된 입력은 22023(invalid_parameter_value)으로 거부한다.
select extensions.throws_ok(
  $$select * from public.get_personalized_recommendations('{}'::jsonb, 'test-model-view-history')$$,
  '22023', null, '조회 기록이 배열이 아니면 거부한다'
);
select extensions.throws_ok(
  $$select * from public.get_personalized_recommendations(
    (select jsonb_agg(jsonb_build_object('sourceType', 'recipe', 'sourceId', gen_random_uuid()::text))
     from generate_series(1, 21)),
    'test-model-view-history'
  )$$,
  '22023', null, '조회 기록이 20개를 넘으면 거부한다'
);
select extensions.throws_ok(
  $$select * from public.get_personalized_recommendations(
    '[{"sourceType":"post","sourceId":"95100000-0000-4000-8000-0000000000a1"}]'::jsonb, 'test-model-view-history')$$,
  '22023', null, '지원하지 않는 종류는 거부한다'
);
select extensions.throws_ok(
  $$select * from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"not-a-uuid"}]'::jsonb, 'test-model-view-history')$$,
  '22023', null, 'UUID가 아닌 ID는 거부한다'
);
select extensions.throws_ok(
  $$select * from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1","viewCount":"3"}]'::jsonb,
    'test-model-view-history')$$,
  '22023', null, '본 횟수가 숫자가 아니면 거부한다'
);
select extensions.throws_ok(
  $$select * from public.get_personalized_recommendations(
    '[{"sourceType":"recipe","sourceId":"95100000-0000-4000-8000-0000000000a1","viewCount":1.5}]'::jsonb,
    'test-model-view-history')$$,
  '22023', null, '본 횟수가 정수가 아니면 거부한다'
);
select extensions.throws_ok(
  $$select * from public.get_personalized_recommendations('[]'::jsonb, '  ')$$,
  '22023', null, '임베딩 모델 ID가 비어 있으면 거부한다'
);
select extensions.throws_ok(
  $$select * from public.get_personalized_recommendations('[]'::jsonb, 'test-model-view-history', null, array['post'])$$,
  '22023', null, '추천 종류에 지원하지 않는 값이 있으면 거부한다'
);
select extensions.throws_ok(
  $$select * from public.get_personalized_recommendations('[]'::jsonb, 'test-model-view-history', null, array[]::text[])$$,
  '22023', null, '추천 종류가 비어 있으면 거부한다'
);

-- 결과 개수는 1~20으로 보정한다(후보 24개).
select extensions.is(
  (
    select count(*)::integer from public.get_personalized_recommendations(
      '[{"sourceType":"recipe","sourceId":"95200000-0000-4000-8000-000000000001"}]'::jsonb,
      'test-model-clamp', null, array['recipe'], 100
    )
  ),
  20,
  '결과 개수는 최대 20개로 제한한다'
);
select extensions.is(
  (
    select count(*)::integer from public.get_personalized_recommendations(
      '[{"sourceType":"recipe","sourceId":"95200000-0000-4000-8000-000000000001"}]'::jsonb,
      'test-model-clamp', null, array['recipe'], 0
    )
  ),
  1,
  '결과 개수가 1보다 작으면 1개로 보정한다'
);
select extensions.is(
  (
    select count(*)::integer from public.get_personalized_recommendations(
      '[{"sourceType":"recipe","sourceId":"95200000-0000-4000-8000-000000000001"}]'::jsonb,
      'test-model-clamp', null, array['recipe'], null
    )
  ),
  5,
  '결과 개수를 주지 않으면 5개를 반환한다'
);

-- 읽기 전용: 여러 번 호출해도 관계·문서 행이 변하지 않는다(북마크 1건은 테스트가 직접 넣은 것).
select extensions.is(
  (
    select row(
      (select count(*) from public.recipe_likes),
      (select count(*) from public.recipe_bookmarks) - 1,
      (select count(*) from private.recommendation_documents)
    )::text
  ),
  (select row(likes, bookmarks, documents)::text from view_history_row_counts),
  '맞춤 추천 호출은 좋아요·북마크·추천 문서 행을 바꾸지 않는다'
);

select * from extensions.finish();

rollback;
