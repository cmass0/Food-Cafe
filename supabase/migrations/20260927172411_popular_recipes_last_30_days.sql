-- 인기 추천 탭: 오늘을 포함한 한국 날짜 기준 최근 30일의 레시피 추천 노출만 집계한다.
-- 기존 전체 누적 레시피·조합 RPC는 다른 용도에 영향을 주지 않도록 유지한다.
create index idx_recipe_recommendation_counts_day
  on private.recipe_recommendation_counts (day, recipe_id);

create or replace function public.get_popular_recipes_30d(
  p_limit integer default 5
)
returns table (
  recipe_id uuid,
  recommendation_count bigint,
  last_recommended_at timestamp with time zone
)
language sql
stable
security invoker
set search_path to ''
as $function$
  with recent as (
    select
      counts.recipe_id,
      sum(counts.recommendation_count)::bigint as recommendation_count,
      max(counts.last_recommended_at) as last_recommended_at
    from private.recipe_recommendation_counts as counts
    where counts.day between (now() at time zone 'Asia/Seoul')::date - 29
      and (now() at time zone 'Asia/Seoul')::date
    group by counts.recipe_id
  )
  select
    recent.recipe_id,
    recent.recommendation_count,
    recent.last_recommended_at
  from recent
  order by
    recent.recommendation_count desc,
    recent.last_recommended_at desc,
    recent.recipe_id
  limit least(greatest(coalesce(p_limit, 5), 1), 50);
$function$;

-- private 집계를 읽는 함수이므로 서버 전용 service_role에만 실행 권한을 준다.
revoke all on function public.get_popular_recipes_30d(integer)
  from public, anon, authenticated, service_role;
grant execute on function public.get_popular_recipes_30d(integer)
  to service_role;

comment on function public.get_popular_recipes_30d(integer) is
  '한국 날짜로 오늘 포함 최근 30일의 레시피 추천 노출 상위 ID를 반환한다. 서버 전용.';
