begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(12);

-- 권한: 브라우저 역할은 카운트를 올리거나 조회할 수 없고 서버 service_role만 실행한다.
select extensions.ok(
  not has_function_privilege('anon', 'public.increment_recommendation_counts(uuid[], uuid[])', 'execute')
  and not has_function_privilege('authenticated', 'public.increment_recommendation_counts(uuid[], uuid[])', 'execute'),
  'anon과 authenticated는 추천 횟수 증가 RPC를 실행할 수 없다'
);

select extensions.ok(
  not has_function_privilege('anon', 'public.get_popular_recommendations(integer)', 'execute')
  and not has_function_privilege('authenticated', 'public.get_popular_recommendations(integer)', 'execute'),
  'anon과 authenticated는 많이 추천 조회 RPC를 실행할 수 없다'
);

select extensions.ok(
  has_function_privilege('service_role', 'public.increment_recommendation_counts(uuid[], uuid[])', 'execute')
  and has_function_privilege('service_role', 'public.get_popular_recommendations(integer)', 'execute'),
  'service_role은 두 RPC를 실행할 수 있다'
);

insert into public.recipes (id, title, steps, image)
values
  ('93000000-0000-4000-8000-000000000001', '추천 횟수 테스트 레시피 A', '[{"description":"재료를 섞는다"}]'::jsonb, 'test-image'),
  ('93000000-0000-4000-8000-000000000002', '추천 횟수 테스트 레시피 B', '[{"description":"재료를 굽는다"}]'::jsonb, 'test-image');

insert into public.combos (id, title)
values ('93000000-0000-4000-8000-000000000003', '추천 횟수 테스트 조합');

-- 한 번의 추천 결과 안에서 같은 ID가 반복돼도 한 번만 센다.
select public.increment_recommendation_counts(
  array[
    '93000000-0000-4000-8000-000000000001',
    '93000000-0000-4000-8000-000000000001'
  ]::uuid[],
  array['93000000-0000-4000-8000-000000000003']::uuid[]
);

select extensions.is(
  (select recommendation_count from private.recipe_recommendation_counts where recipe_id = '93000000-0000-4000-8000-000000000001'),
  1,
  '한 요청 안의 중복 레시피 ID는 한 번만 센다'
);

select extensions.is(
  (select day from private.recipe_recommendation_counts where recipe_id = '93000000-0000-4000-8000-000000000001'),
  (now() at time zone 'Asia/Seoul')::date,
  '추천 날짜는 한국 시간 기준으로 저장한다'
);

-- 같은 날 다시 추천되면 새 행을 만들지 않고 기존 행을 1 증가시킨다.
select public.increment_recommendation_counts(
  array['93000000-0000-4000-8000-000000000001', '93000000-0000-4000-8000-000000000002']::uuid[],
  '{}'::uuid[]
);

select extensions.is(
  (select recommendation_count from private.recipe_recommendation_counts where recipe_id = '93000000-0000-4000-8000-000000000001'),
  2,
  '같은 날 다시 추천되면 기존 카운트가 1 증가한다'
);

select extensions.is(
  (
    select count(*)::integer
    from public.increment_recommendation_counts(
      array['93000000-0000-4000-8000-0000000000ff']::uuid[],
      '{}'::uuid[]
    ) as call
    cross join private.recipe_recommendation_counts as counts
    where counts.recipe_id = '93000000-0000-4000-8000-0000000000ff'
  ),
  0,
  '존재하지 않는 원본 ID는 오류 없이 건너뛴다'
);

select extensions.throws_ok(
  $$select public.increment_recommendation_counts(
    array_fill('93000000-0000-4000-8000-000000000001'::uuid, array[21]),
    '{}'::uuid[]
  )$$,
  '22023',
  '한 번에 기록할 수 있는 추천 수를 초과했습니다.',
  '한 번에 20개를 넘는 추천 기록 요청은 거부한다'
);

-- 조회: 누적 횟수 내림차순, 동점이면 최근 추천 순으로 정렬한다.
update private.recipe_recommendation_counts
set last_recommended_at = now() - interval '1 hour'
where recipe_id = '93000000-0000-4000-8000-000000000002';

select extensions.results_eq(
  $$
    select source_type, source_id, recommendation_count
    from public.get_popular_recommendations(50)
    where source_id in (
      '93000000-0000-4000-8000-000000000001',
      '93000000-0000-4000-8000-000000000002',
      '93000000-0000-4000-8000-000000000003'
    )
  $$,
  $$
    values
      ('recipe'::text, '93000000-0000-4000-8000-000000000001'::uuid, 2::bigint),
      ('combo'::text, '93000000-0000-4000-8000-000000000003'::uuid, 1::bigint),
      ('recipe'::text, '93000000-0000-4000-8000-000000000002'::uuid, 1::bigint)
  $$,
  '많이 추천은 누적 횟수 내림차순, 동점이면 최근 추천 순으로 반환한다'
);

-- 여러 날짜의 기록은 전체 누적으로 합산한다.
insert into private.recipe_recommendation_counts (recipe_id, day, recommendation_count)
values ('93000000-0000-4000-8000-000000000002', (now() at time zone 'Asia/Seoul')::date - 3, 5);

select extensions.is(
  (
    select recommendation_count
    from public.get_popular_recommendations(50)
    where source_id = '93000000-0000-4000-8000-000000000002'
  ),
  6::bigint,
  '여러 날짜의 추천 횟수를 전체 누적으로 합산한다'
);

-- 원본 삭제 시 FK CASCADE로 해당 카운트만 함께 정리된다.
delete from public.recipes where id = '93000000-0000-4000-8000-000000000002';

select extensions.is(
  (select count(*)::integer from private.recipe_recommendation_counts where recipe_id = '93000000-0000-4000-8000-000000000002'),
  0,
  '레시피 삭제 시 해당 추천 횟수가 모든 날짜에서 삭제된다'
);

delete from public.combos where id = '93000000-0000-4000-8000-000000000003';

select extensions.is(
  (
    select count(*)::integer
    from private.combo_recommendation_counts
    where combo_id = '93000000-0000-4000-8000-000000000003'
  ) + (
    select count(*)::integer
    from private.recipe_recommendation_counts
    where recipe_id = '93000000-0000-4000-8000-000000000001'
  ),
  1,
  '조합 삭제 시 해당 조합 카운트만 삭제되고 다른 레시피 카운트는 남는다'
);

select * from extensions.finish();
rollback;
