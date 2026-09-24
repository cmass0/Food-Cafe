-- AI 추천 결과로 카드에 노출한 레시피·콤보의 추천 횟수를 원자적으로 1씩 올린다.
-- 앱에서 값을 읽어 더하지 않고 on conflict do update로 증가시켜 동시 요청에서도 누락이 없다.
create or replace function public.increment_recommendation_counts(
  p_recipe_ids uuid[] default '{}'::uuid[],
  p_combo_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_recipe_ids uuid[] := coalesce(p_recipe_ids, '{}'::uuid[]);
  v_combo_ids uuid[] := coalesce(p_combo_ids, '{}'::uuid[]);
  -- DB 기본 시간대(UTC)가 아니라 서비스 사용자의 날짜 기준으로 집계한다.
  v_day date := (now() at time zone 'Asia/Seoul')::date;
begin
  -- 검색 RPC가 한 번에 반환하는 최대 후보 수(20)를 넘는 요청은 정상 추천 결과가 아니다.
  if cardinality(v_recipe_ids) + cardinality(v_combo_ids) > 20 then
    raise exception '한 번에 기록할 수 있는 추천 수를 초과했습니다.'
      using errcode = '22023';
  end if;

  -- 원본 테이블과 조인해 중복 ID를 한 번만 세고, 이미 삭제된 원본은 조용히 건너뛴다.
  insert into private.recipe_recommendation_counts as counts (recipe_id, day)
  select recipe.id, v_day
  from public.recipes as recipe
  where recipe.id = any(v_recipe_ids)
  on conflict (recipe_id, day) do update
  set
    recommendation_count = counts.recommendation_count + 1,
    last_recommended_at = now();

  insert into private.combo_recommendation_counts as counts (combo_id, day)
  select combo.id, v_day
  from public.combos as combo
  where combo.id = any(v_combo_ids)
  on conflict (combo_id, day) do update
  set
    recommendation_count = counts.recommendation_count + 1,
    last_recommended_at = now();
end;
$function$;

-- AI 추천 채팅에서 가장 많이 추천된 레시피·콤보를 전체 누적 기준으로 반환한다.
-- 카드 표시용 값은 호출한 서버가 원본 테이블에서 다시 조회한다.
create or replace function public.get_popular_recommendations(
  p_limit integer default 10
)
returns table (
  source_type text,
  source_id uuid,
  recommendation_count bigint,
  last_recommended_at timestamp with time zone
)
language sql
stable
security definer
set search_path to ''
as $function$
  with totals as (
    select
      'recipe'::text as source_type,
      counts.recipe_id as source_id,
      sum(counts.recommendation_count)::bigint as recommendation_count,
      max(counts.last_recommended_at) as last_recommended_at
    from private.recipe_recommendation_counts as counts
    group by counts.recipe_id

    union all

    select
      'combo'::text,
      counts.combo_id,
      sum(counts.recommendation_count)::bigint,
      max(counts.last_recommended_at)
    from private.combo_recommendation_counts as counts
    group by counts.combo_id
  )
  select
    totals.source_type,
    totals.source_id,
    totals.recommendation_count,
    totals.last_recommended_at
  from totals
  -- 동점이면 최근에 추천된 항목을 먼저 보여주고, 마지막으로 ID로 순서를 고정한다.
  order by
    totals.recommendation_count desc,
    totals.last_recommended_at desc,
    totals.source_type,
    totals.source_id
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
$function$;

-- 브라우저가 카운트를 직접 올리거나 private 집계를 조회하지 못하게 서버 service_role에만 연다.
revoke all on function public.increment_recommendation_counts(uuid[], uuid[])
  from public, anon, authenticated, service_role;
grant execute on function public.increment_recommendation_counts(uuid[], uuid[])
  to service_role;

revoke all on function public.get_popular_recommendations(integer)
  from public, anon, authenticated, service_role;
grant execute on function public.get_popular_recommendations(integer)
  to service_role;

comment on function public.increment_recommendation_counts(uuid[], uuid[]) is
  'AI 추천 카드로 노출한 레시피·콤보의 한국 날짜별 추천 횟수를 원자적으로 증가시킨다. 서버 전용.';
comment on function public.get_popular_recommendations(integer) is
  'AI 추천 채팅에서 전체 누적 추천 횟수가 많은 레시피·콤보 ID를 반환한다. 서버 전용.';
