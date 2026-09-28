begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(12);

select extensions.ok(
  not has_function_privilege('anon', 'public.get_popular_recommendations_30d(integer)', 'execute'),
  '익명 사용자는 인기 추천 집계 RPC를 직접 실행할 수 없다'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'public.get_popular_recommendations_30d(integer)', 'execute'),
  '로그인 사용자도 인기 추천 집계 RPC를 직접 실행할 수 없다'
);
select extensions.ok(
  has_function_privilege('service_role', 'public.get_popular_recommendations_30d(integer)', 'execute'),
  '서버의 service_role은 인기 추천 집계 RPC를 실행할 수 있다'
);

set local role anon;
select extensions.throws_ok(
  $$select * from public.get_popular_recommendations_30d(5)$$,
  '42501',
  null,
  '익명 실행은 실제로 권한 오류가 난다'
);
reset role;

set local role authenticated;
select extensions.throws_ok(
  $$select * from public.get_popular_recommendations_30d(5)$$,
  '42501',
  null,
  '로그인 사용자 실행도 실제로 권한 오류가 난다'
);
reset role;

select extensions.hasnt_function(
  'public',
  'get_popular_recipes_30d',
  array['integer'],
  '레시피만 집계하던 이전 함수는 남아 있지 않다'
);

-- 로컬 테스트 DB에서만 실행한다. 모든 변경은 끝에서 롤백한다.
delete from private.recipe_recommendation_counts;
delete from private.combo_recommendation_counts;

insert into public.recipes (id, title, steps, image)
values
  ('94000000-0000-4000-8000-000000000001', '인기 레시피 A', '[]'::jsonb, 'test-image'),
  ('94000000-0000-4000-8000-000000000002', '인기 레시피 B', '[]'::jsonb, 'test-image'),
  ('94000000-0000-4000-8000-000000000003', '인기 레시피 C', '[]'::jsonb, 'test-image'),
  ('94000000-0000-4000-8000-000000000004', '인기 레시피 D', '[]'::jsonb, 'test-image');

insert into public.combos (id, title)
values
  ('94000000-0000-4000-8000-000000000005', '인기 조합 A'),
  ('94000000-0000-4000-8000-000000000006', '인기 조합 B'),
  ('94000000-0000-4000-8000-000000000007', '미래 기록만 있는 조합');

-- now()는 트랜잭션 안에서 고정되므로 같은 식을 쓰면 마지막 노출 시각도 정확히 같다.
insert into private.recipe_recommendation_counts
  (recipe_id, day, recommendation_count, last_recommended_at)
values
  ('94000000-0000-4000-8000-000000000001', (now() at time zone 'Asia/Seoul')::date - 29, 2, now() - interval '29 days'),
  ('94000000-0000-4000-8000-000000000001', (now() at time zone 'Asia/Seoul')::date, 3, now() - interval '1 hour'),
  ('94000000-0000-4000-8000-000000000002', (now() at time zone 'Asia/Seoul')::date, 4, now() - interval '2 hours'),
  ('94000000-0000-4000-8000-000000000003', (now() at time zone 'Asia/Seoul')::date, 2, now() - interval '3 hours'),
  ('94000000-0000-4000-8000-000000000004', (now() at time zone 'Asia/Seoul')::date - 10, 1, now() - interval '10 days'),
  ('94000000-0000-4000-8000-000000000004', (now() at time zone 'Asia/Seoul')::date + 1, 100, now() + interval '1 day');

insert into private.combo_recommendation_counts
  (combo_id, day, recommendation_count, last_recommended_at)
values
  ('94000000-0000-4000-8000-000000000005', (now() at time zone 'Asia/Seoul')::date, 5, now() - interval '30 minutes'),
  ('94000000-0000-4000-8000-000000000006', (now() at time zone 'Asia/Seoul')::date - 30, 100, now() - interval '30 days'),
  ('94000000-0000-4000-8000-000000000006', (now() at time zone 'Asia/Seoul')::date, 2, now() - interval '3 hours'),
  ('94000000-0000-4000-8000-000000000007', (now() at time zone 'Asia/Seoul')::date + 1, 50, now() + interval '1 day');

set local role service_role;
select extensions.lives_ok(
  $$select * from public.get_popular_recommendations_30d(5)$$,
  '서버 역할은 private 일별 집계를 읽고 RPC를 실행할 수 있다'
);
reset role;

select extensions.results_eq(
  $$select source_type, source_id, recommendation_count
    from public.get_popular_recommendations_30d(10)$$,
  $$values
    ('combo'::text, '94000000-0000-4000-8000-000000000005'::uuid, 5::bigint),
    ('recipe'::text, '94000000-0000-4000-8000-000000000001'::uuid, 5::bigint),
    ('recipe'::text, '94000000-0000-4000-8000-000000000002'::uuid, 4::bigint),
    ('combo'::text, '94000000-0000-4000-8000-000000000006'::uuid, 2::bigint),
    ('recipe'::text, '94000000-0000-4000-8000-000000000003'::uuid, 2::bigint),
    ('recipe'::text, '94000000-0000-4000-8000-000000000004'::uuid, 1::bigint)
  $$,
  '레시피와 조합을 노출수로 섞고, 동점은 최근 노출 → 종류 → ID 순으로 정렬한다'
);

select extensions.is(
  (select count(*)::integer from public.get_popular_recommendations_30d(0)),
  1,
  '요청 개수 0은 최소 1개로 보정한다'
);

select extensions.is(
  (select recommendation_count from public.get_popular_recommendations_30d(10)
   where source_type = 'combo' and source_id = '94000000-0000-4000-8000-000000000006'),
  2::bigint,
  '조합도 30일 전 날짜는 집계에서 제외한다'
);

select extensions.is(
  (select recommendation_count from public.get_popular_recommendations_30d(10)
   where source_type = 'recipe' and source_id = '94000000-0000-4000-8000-000000000004'),
  1::bigint,
  '미래 날짜는 집계에서 제외한다'
);

select extensions.is(
  (select count(*)::integer from public.get_popular_recommendations_30d(10)
   where source_id = '94000000-0000-4000-8000-000000000007'),
  0,
  '미래 기록만 있는 조합은 순위에 나오지 않는다'
);

select * from extensions.finish();
rollback;
