-- 인기 레시피 집계를 빠르게 한다. 결과는 바꾸지 않는다.
--
-- 부하 테스트(레시피 1만·주간 활동 약 3.6만 건)에서 이 함수는 1회 약 45ms로 DB 시간의 22%를 썼다(홈·랭킹).
-- 순위는 활동 숫자만으로 정해지는데, 활동이 있었던 레시피 전부(약 9천 개)에 레시피 행을 먼저 붙인 뒤
-- 상위 N개를 골랐다. 상위 N개를 먼저 고르고 그 N개에만 레시피 정보를 붙인다.
-- 활동 행은 레시피 FK(ON DELETE CASCADE)로 지워지므로, 집계된 레시피는 항상 존재해 결과 행이 줄지 않는다.
-- 시그니처가 같으므로 CREATE OR REPLACE로 본체만 바꾸고, 기존 실행 권한을 유지한다.

create or replace function public.get_trending_recipes(p_period text default 'week', p_limit integer default 10)
returns table(
  id uuid,
  title text,
  summary text,
  image text,
  tags text[],
  like_count integer,
  bookmark_count integer,
  comment_count integer,
  view_count integer,
  created_at timestamp with time zone,
  writer_uid uuid,
  writer_name text,
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
    aggregated as (
      select
        e.resource_id,
        count(*) filter (where e.activity_type = 'like')::bigint as recent_like_count,
        count(*) filter (where e.activity_type = 'bookmark')::bigint as recent_bookmark_count,
        count(*) filter (where e.activity_type = 'comment')::bigint as recent_comment_count,
        count(distinct e.user_id)::bigint as recent_participant_count,
        count(*)::bigint as recent_activity_count,
        max(e.created_at) as last_activity_at
      from recent_events e
      group by e.resource_id
    ),
    -- 순위는 활동 숫자만으로 정해지므로 상위 N개를 먼저 고른다.
    ranked as (
      select
        a.resource_id,
        a.recent_like_count,
        a.recent_bookmark_count,
        a.recent_comment_count,
        a.recent_participant_count,
        a.recent_activity_count,
        (
          a.recent_participant_count * 10
          + a.recent_like_count * 2
          + a.recent_bookmark_count * 3
          + a.recent_comment_count * 4
        )::bigint as trend_score,
        a.last_activity_at
      from aggregated a
      order by
        trend_score desc,
        a.recent_participant_count desc,
        a.recent_bookmark_count desc,
        a.resource_id
      limit greatest(1, least(coalesce(p_limit, 10), 50))
    )
    select
      r.id,
      r.title,
      r.summary,
      r.image,
      r.tags,
      r.like_count,
      r.bookmark_count,
      r.comment_count,
      r.view_count,
      r.created_at,
      r.writer_uid,
      r.writer_name,
      rk.recent_like_count,
      rk.recent_bookmark_count,
      rk.recent_comment_count,
      rk.recent_participant_count,
      rk.recent_activity_count,
      rk.trend_score,
      rk.last_activity_at
    from ranked rk
    join public.recipes r on r.id = rk.resource_id
    order by
      rk.trend_score desc,
      rk.recent_participant_count desc,
      rk.recent_bookmark_count desc,
      r.id;
end;
$function$;
