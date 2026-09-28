-- 인기 추천 탭을 레시피와 조합을 섞은 순위로 바꾼다. 두 종류 모두 같은 채팅 추천에서 쌓인
-- 노출수이므로 종류별 보정 없이 합계로 비교한다.
create index idx_combo_recommendation_counts_day
  on private.combo_recommendation_counts (day, combo_id);

create or replace function public.get_popular_recommendations_30d(
  p_limit integer default 5
)
returns table (
  source_type text,
  source_id uuid,
  recommendation_count bigint,
  last_recommended_at timestamp with time zone
)
language sql
stable
security invoker
set search_path to ''
as $function$
  with period as (
    select (now() at time zone 'Asia/Seoul')::date as today
  ),
  daily as (
    select
      'recipe'::text as source_type,
      counts.recipe_id as source_id,
      counts.recommendation_count,
      counts.last_recommended_at
    from private.recipe_recommendation_counts as counts
    cross join period
    where counts.day between period.today - 29 and period.today

    union all

    select
      'combo'::text,
      counts.combo_id,
      counts.recommendation_count,
      counts.last_recommended_at
    from private.combo_recommendation_counts as counts
    cross join period
    where counts.day between period.today - 29 and period.today
  ),
  recent as (
    select
      daily.source_type,
      daily.source_id,
      sum(daily.recommendation_count)::bigint as recommendation_count,
      max(daily.last_recommended_at) as last_recommended_at
    from daily
    group by daily.source_type, daily.source_id
  )
  select
    recent.source_type,
    recent.source_id,
    recent.recommendation_count,
    recent.last_recommended_at
  from recent
  order by
    recent.recommendation_count desc,
    recent.last_recommended_at desc,
    recent.source_type,
    recent.source_id
  limit least(greatest(coalesce(p_limit, 5), 1), 50);
$function$;

-- private 집계를 읽는 함수이므로 서버 전용 service_role에만 실행 권한을 준다.
revoke all on function public.get_popular_recommendations_30d(integer)
  from public, anon, authenticated, service_role;
grant execute on function public.get_popular_recommendations_30d(integer)
  to service_role;

comment on function public.get_popular_recommendations_30d(integer) is
  '한국 날짜로 오늘 포함 최근 30일의 레시피·조합 추천 노출을 합산해 상위 순위를 반환한다. 서버 전용.';

-- 레시피만 집계하던 이전 함수는 인기 추천 라우트만 사용했으므로 새 함수로 대체한다.
drop function public.get_popular_recipes_30d(integer);
