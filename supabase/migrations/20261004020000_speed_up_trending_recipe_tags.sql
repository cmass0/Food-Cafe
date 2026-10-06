-- 인기 레시피 태그 집계를 빠르게 한다. 결과는 바꾸지 않는다.
--
-- 부하 테스트(레시피 1만·주간 활동 약 3.6만 건)에서 홈 화면이 다른 화면보다 약 20배 느렸고,
-- 원인은 이 함수 1회 약 300ms였다. 실행 계획상 비용은 두 곳이었다.
--   1. 활동 행(3.6만)을 태그로 먼저 펼쳐(12.8만 행) 태그·레시피·사용자별 중복 제거 정렬을 했다.
--      작업 메모리(4MB)를 넘어 디스크 정렬(약 8.6MB)이 일어났다.
--   2. 모든 레시피의 모든 태그를 매번 세어(전체 레시피 수) 순위에 들지 않는 태그까지 계산했다.
-- 고친 방법
--   1. 활동을 레시피별로 먼저 합친 뒤(수천 행) 태그로 펼친다. 합계는 그대로 더하면 되고,
--      참여자 수만 (태그, 사용자) 쌍의 중복을 따로 없애 센다.
--   2. 전체 레시피 수는 순위에 든 태그만 센다.
-- 시그니처가 같으므로 CREATE OR REPLACE로 본체만 바꾸고, 기존 실행 권한을 유지한다.

create or replace function public.get_trending_recipe_tags(p_period text default 'week', p_limit integer default 10)
returns table(
  tag text,
  recent_recipe_count bigint,
  total_recipe_count bigint,
  recent_like_count bigint,
  recent_bookmark_count bigint,
  recent_comment_count bigint,
  recent_participant_count bigint,
  recent_activity_count bigint,
  trend_score bigint,
  last_activity_at timestamp with time zone
)
language plpgsql
stable
security definer
set search_path to ''
as $function$
#variable_conflict use_column
begin
  -- 계산 SQL은 비교할 활동 행이 없으면 기간 계산을 건너뛴다.
  -- 활동이 없어도 지원하지 않는 기간을 거부하도록 먼저 검증한다.
  perform private.trending_window_start(p_period);

  return query
    with window_start as (
      select private.trending_window_start(p_period) as since
    ),
    recent_events as (
      select rl.recipe_id as resource_id, rl.user_id, 'like'::text as activity_type, rl.created_at
      from public.recipe_likes rl
      where rl.created_at >= (select since from window_start)

      union all

      select rb.recipe_id, rb.user_id, 'bookmark'::text, rb.created_at
      from public.recipe_bookmarks rb
      where rb.created_at >= (select since from window_start)

      union all

      select c.recipe_id, c.writer_uid, 'comment'::text, c.created_at
      from public.comments c
      where c.recipe_id is not null
        and c.deleted_at is null
        and c.created_at >= (select since from window_start)
    ),
    -- 태그로 펼치기 전에 레시피별로 먼저 합친다.
    recipe_activity as (
      select
        e.resource_id,
        count(*) filter (where e.activity_type = 'like') as like_count,
        count(*) filter (where e.activity_type = 'bookmark') as bookmark_count,
        count(*) filter (where e.activity_type = 'comment') as comment_count,
        count(*) as activity_count,
        max(e.created_at) as last_activity_at
      from recent_events e
      group by e.resource_id
    ),
    -- 태그는 앞뒤 공백을 지워 합치고, 빈 태그는 뺀다.
    recipe_tags as (
      select a.resource_id, a.like_count, a.bookmark_count, a.comment_count, a.activity_count,
        a.last_activity_at, trim(t.tag) as tag
      from recipe_activity a
      join public.recipes r on r.id = a.resource_id
      cross join lateral unnest(r.tags) as t(tag)
      where trim(t.tag) <> ''
    ),
    -- 태그·레시피 쌍으로 한 번 더 합친다. 이 쌍의 개수가 태그별 활동 레시피 수다.
    tag_recipes as (
      select
        rt.tag,
        rt.resource_id,
        sum(rt.like_count) as like_count,
        sum(rt.bookmark_count) as bookmark_count,
        sum(rt.comment_count) as comment_count,
        sum(rt.activity_count) as activity_count,
        max(rt.last_activity_at) as last_activity_at
      from recipe_tags rt
      group by rt.tag, rt.resource_id
    ),
    aggregated as (
      select
        tr.tag,
        count(*)::bigint as recent_recipe_count,
        sum(tr.like_count)::bigint as recent_like_count,
        sum(tr.bookmark_count)::bigint as recent_bookmark_count,
        sum(tr.comment_count)::bigint as recent_comment_count,
        sum(tr.activity_count)::bigint as recent_activity_count,
        max(tr.last_activity_at) as last_activity_at
      from tag_recipes tr
      group by tr.tag
    ),
    -- 참여자 수는 레시피를 건너 합칠 수 없으므로 (태그, 사용자) 쌍의 중복을 없애 센다.
    participants as (
      select pair.tag, count(*)::bigint as recent_participant_count
      from (
        select distinct tr.tag, e.user_id
        from (
          select distinct ev.resource_id, ev.user_id
          from recent_events ev
          where ev.user_id is not null
        ) e
        join tag_recipes tr on tr.resource_id = e.resource_id
      ) pair
      group by pair.tag
    ),
    ranked as (
      select
        a.tag,
        a.recent_recipe_count,
        a.recent_like_count,
        a.recent_bookmark_count,
        a.recent_comment_count,
        coalesce(p.recent_participant_count, 0)::bigint as recent_participant_count,
        a.recent_activity_count,
        (
          coalesce(p.recent_participant_count, 0) * 10
          + a.recent_like_count * 2
          + a.recent_bookmark_count * 3
          + a.recent_comment_count * 4
        )::bigint as trend_score,
        a.last_activity_at
      from aggregated a
      left join participants p on p.tag = a.tag
      order by
        trend_score desc,
        recent_participant_count desc,
        a.recent_recipe_count desc,
        a.last_activity_at desc,
        a.tag
      limit greatest(1, least(coalesce(p_limit, 10), 50))
    ),
    -- 전체 레시피 수는 순위에 든 태그만 센다.
    totals as (
      select tagged.tag, count(*)::bigint as total_recipe_count
      from (
        select distinct trim(t.tag) as tag, r.id
        from public.recipes r
        cross join lateral unnest(r.tags) as t(tag)
        where trim(t.tag) in (select rk.tag from ranked rk)
      ) tagged
      group by tagged.tag
    )
    select
      rk.tag,
      rk.recent_recipe_count,
      coalesce(tt.total_recipe_count, 0)::bigint,
      rk.recent_like_count,
      rk.recent_bookmark_count,
      rk.recent_comment_count,
      rk.recent_participant_count,
      rk.recent_activity_count,
      rk.trend_score,
      rk.last_activity_at
    from ranked rk
    left join totals tt on tt.tag = rk.tag
    order by
      rk.trend_score desc,
      rk.recent_participant_count desc,
      rk.recent_recipe_count desc,
      rk.last_activity_at desc,
      rk.tag;
end;
$function$;

comment on function public.get_trending_recipe_tags(text, integer) is
  '기간(day·week·month) 동안의 참여를 집계해 인기 레시피 태그 순위를 반환한다. 활동을 레시피별로 먼저 합친 뒤 태그로 펼치고, 전체 레시피 수는 순위에 든 태그만 센다. 좋아요·북마크 RLS를 넘어 전체를 세려고 SECURITY DEFINER를 쓰며, 공개 정보와 합계만 반환하므로 anon 실행을 허용한다.';
