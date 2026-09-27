begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(10);

select extensions.ok(
  not has_function_privilege('anon', 'public.get_popular_recipes_30d(integer)', 'execute'),
  '익명 사용자는 인기 추천 집계 RPC를 직접 실행할 수 없다'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'public.get_popular_recipes_30d(integer)', 'execute'),
  '로그인 사용자도 인기 추천 집계 RPC를 직접 실행할 수 없다'
);
select extensions.ok(
  has_function_privilege('service_role', 'public.get_popular_recipes_30d(integer)', 'execute'),
  '서버의 service_role은 인기 추천 집계 RPC를 실행할 수 있다'
);

set local role anon;
select extensions.throws_ok(
  $$select * from public.get_popular_recipes_30d(5)$$,
  '42501',
  null,
  '익명 실행은 실제로 권한 오류가 난다'
);
reset role;

set local role authenticated;
select extensions.throws_ok(
  $$select * from public.get_popular_recipes_30d(5)$$,
  '42501',
  null,
  '로그인 사용자 실행도 실제로 권한 오류가 난다'
);
reset role;

-- 로컬 테스트 DB에서만 실행한다. 모든 변경은 끝에서 롤백한다.
delete from private.recipe_recommendation_counts;
delete from private.combo_recommendation_counts;

insert into public.recipes (id, title, steps, image)
values
  ('94000000-0000-4000-8000-000000000001', '인기 추천 A', '[]'::jsonb, 'test-image'),
  ('94000000-0000-4000-8000-000000000002', '인기 추천 B', '[]'::jsonb, 'test-image'),
  ('94000000-0000-4000-8000-000000000003', '인기 추천 C', '[]'::jsonb, 'test-image'),
  ('94000000-0000-4000-8000-000000000004', '인기 추천 D', '[]'::jsonb, 'test-image');

insert into public.combos (id, title)
values ('94000000-0000-4000-8000-000000000005', '인기 추천 제외 조합');

insert into private.recipe_recommendation_counts
  (recipe_id, day, recommendation_count, last_recommended_at)
values
  ('94000000-0000-4000-8000-000000000001', (now() at time zone 'Asia/Seoul')::date - 29, 2, now() - interval '29 days'),
  ('94000000-0000-4000-8000-000000000001', (now() at time zone 'Asia/Seoul')::date, 3, now() - interval '1 hour'),
  ('94000000-0000-4000-8000-000000000002', (now() at time zone 'Asia/Seoul')::date, 5, now() - interval '2 hours'),
  ('94000000-0000-4000-8000-000000000003', (now() at time zone 'Asia/Seoul')::date - 30, 100, now() - interval '30 days'),
  ('94000000-0000-4000-8000-000000000003', (now() at time zone 'Asia/Seoul')::date, 1, now()),
  ('94000000-0000-4000-8000-000000000004', (now() at time zone 'Asia/Seoul')::date - 10, 2, now() - interval '10 days'),
  ('94000000-0000-4000-8000-000000000004', (now() at time zone 'Asia/Seoul')::date + 1, 100, now() + interval '1 day');

insert into private.combo_recommendation_counts (combo_id, day, recommendation_count)
values ('94000000-0000-4000-8000-000000000005', (now() at time zone 'Asia/Seoul')::date, 1000);

set local role service_role;
select extensions.lives_ok(
  $$select * from public.get_popular_recipes_30d(5)$$,
  '서버 역할은 private 일별 집계를 읽고 RPC를 실행할 수 있다'
);
reset role;

select extensions.results_eq(
  $$select recipe_id, recommendation_count from public.get_popular_recipes_30d(5)$$,
  $$values
    ('94000000-0000-4000-8000-000000000001'::uuid, 5::bigint),
    ('94000000-0000-4000-8000-000000000002'::uuid, 5::bigint),
    ('94000000-0000-4000-8000-000000000004'::uuid, 2::bigint),
    ('94000000-0000-4000-8000-000000000003'::uuid, 1::bigint)
  $$,
  '오늘 포함 30일만 합산하며 동점은 최근 노출 순으로 정렬하고 조합은 제외한다'
);

select extensions.is(
  (select count(*)::integer from public.get_popular_recipes_30d(0)),
  1,
  '요청 개수 0은 최소 1개로 보정한다'
);

select extensions.is(
  (select recommendation_count from public.get_popular_recipes_30d(5)
   where recipe_id = '94000000-0000-4000-8000-000000000003'),
  1::bigint,
  '30일 전 날짜는 집계에서 제외한다'
);

select extensions.is(
  (select recommendation_count from public.get_popular_recipes_30d(5)
   where recipe_id = '94000000-0000-4000-8000-000000000004'),
  2::bigint,
  '미래 날짜는 집계에서 제외한다'
);

select * from extensions.finish();
rollback;
