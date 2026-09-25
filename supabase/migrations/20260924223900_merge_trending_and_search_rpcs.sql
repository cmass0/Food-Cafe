-- 트렌딩·추천 검색 RPC의 public 껍데기 + private 본체 2중 구조를 public 함수 하나로 합친다.
--   - 계산 SQL은 기존 private 본체를 그대로 옮긴다(결과·정렬·점수 규칙 동일).
--   - 이름 규칙: get_trending_<대상>(p_period, p_limit)
--   - 합친 함수는 SECURITY DEFINER + 빈 search_path. 좋아요·북마크 테이블은 RLS로 본인 행만 보이므로
--     전체 집계에는 권한 상승이 필요하다. 반환값은 공개 콘텐츠 정보와 합계뿐이고 누가 참여했는지는 내보내지 않는다.
--   - anon이 private 스키마를 사용할 필요가 없어져 USAGE를 회수한다.

-- 레시피 트렌딩 ---------------------------------------------------------------

create function public.get_trending_recipes(p_period text default 'week', p_limit integer default 10)
returns table (
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
set search_path = ''
as $$
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
      select
        rl.recipe_id as resource_id,
        rl.user_id,
        'like'::text as activity_type,
        rl.created_at
      from public.recipe_likes rl
      where rl.created_at >= (select since from window_start)

      union all

      select
        rb.recipe_id,
        rb.user_id,
        'bookmark'::text,
        rb.created_at
      from public.recipe_bookmarks rb
      where rb.created_at >= (select since from window_start)

      union all

      select
        c.recipe_id,
        c.writer_uid,
        'comment'::text,
        c.created_at
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
    join public.recipes r on r.id = a.resource_id
    order by
      trend_score desc,
      a.recent_participant_count desc,
      a.recent_bookmark_count desc,
      r.id
    limit greatest(1, least(coalesce(p_limit, 10), 50));
end;
$$;

comment on function public.get_trending_recipes(text, integer) is
  '기간(day·week·month) 동안의 참여를 집계해 인기 레시피 순위를 반환한다. 좋아요·북마크 RLS를 넘어 전체를 세려고 SECURITY DEFINER를 쓰며, 공개 정보와 합계만 반환하므로 anon 실행을 허용한다.';

-- 조합 트렌딩 ---------------------------------------------------------------

create function public.get_trending_combos(p_period text default 'week', p_limit integer default 10)
returns table (
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
set search_path = ''
as $$
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
      select
        cl.combo_id as resource_id,
        cl.user_id,
        'like'::text as activity_type,
        cl.created_at
      from public.combo_likes cl
      where cl.created_at >= (select since from window_start)

      union all

      select
        cb.combo_id,
        cb.user_id,
        'bookmark'::text,
        cb.created_at
      from public.combo_bookmarks cb
      where cb.created_at >= (select since from window_start)

      union all

      select
        c.combo_id,
        c.writer_uid,
        'comment'::text,
        c.created_at
      from public.comments c
      where c.combo_id is not null
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
    )
    select
      c.id,
      c.title,
      c.summary,
      c.image,
      c.tags,
      c.like_count,
      c.bookmark_count,
      c.comment_count,
      c.view_count,
      c.created_at,
      c.writer_uid,
      c.writer_name,
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
    join public.combos c on c.id = a.resource_id
    order by
      trend_score desc,
      a.recent_participant_count desc,
      a.recent_bookmark_count desc,
      c.id
    limit greatest(1, least(coalesce(p_limit, 10), 50));
end;
$$;

comment on function public.get_trending_combos(text, integer) is
  '기간(day·week·month) 동안의 참여를 집계해 인기 조합 순위를 반환한다. 좋아요·북마크 RLS를 넘어 전체를 세려고 SECURITY DEFINER를 쓰며, 공개 정보와 합계만 반환하므로 anon 실행을 허용한다.';

-- 게시글 트렌딩 ---------------------------------------------------------------

create function public.get_trending_posts(p_period text default 'week', p_limit integer default 10)
returns table (
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
set search_path = ''
as $$
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
      select
        pl.post_id as resource_id,
        pl.user_id,
        'like'::text as activity_type,
        pl.created_at
      from public.post_likes pl
      where pl.created_at >= (select since from window_start)

      union all

      select
        pb.post_id,
        pb.user_id,
        'bookmark'::text,
        pb.created_at
      from public.post_bookmarks pb
      where pb.created_at >= (select since from window_start)

      union all

      select
        c.post_id,
        c.writer_uid,
        'comment'::text,
        c.created_at
      from public.comments c
      where c.post_id is not null
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
    )
    select
      p.id,
      p.title,
      nullif(left(coalesce(p.content_text, ''), 160), '') as summary,
      null::text as image,
      p.tags,
      p.like_count,
      p.bookmark_count,
      p.comment_count,
      p.view_count,
      p.created_at,
      p.writer_uid,
      p.writer_name,
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
    join public.posts p on p.id = a.resource_id
    order by
      trend_score desc,
      a.recent_participant_count desc,
      a.recent_bookmark_count desc,
      p.id
    limit greatest(1, least(coalesce(p_limit, 10), 50));
end;
$$;

comment on function public.get_trending_posts(text, integer) is
  '기간(day·week·month) 동안의 참여를 집계해 인기 게시글 순위를 반환한다. 좋아요·북마크 RLS를 넘어 전체를 세려고 SECURITY DEFINER를 쓰며, 공개 정보와 합계만 반환하므로 anon 실행을 허용한다.';

-- 레시피 태그 트렌딩 ---------------------------------------------------------------

create function public.get_trending_recipe_tags(p_period text default 'week', p_limit integer default 10)
returns table (
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
set search_path = ''
as $$
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
      select
        rl.recipe_id as resource_id,
        rl.user_id,
        'like'::text as activity_type,
        rl.created_at
      from public.recipe_likes rl
      where rl.created_at >= (select since from window_start)

      union all

      select
        rb.recipe_id,
        rb.user_id,
        'bookmark'::text,
        rb.created_at
      from public.recipe_bookmarks rb
      where rb.created_at >= (select since from window_start)

      union all

      select
        c.recipe_id,
        c.writer_uid,
        'comment'::text,
        c.created_at
      from public.comments c
      where c.recipe_id is not null
        and c.deleted_at is null
        and c.created_at >= (select since from window_start)
    ),
    tagged_events as (
      select
        trim(t.tag) as tag,
        e.resource_id,
        e.user_id,
        e.activity_type,
        e.created_at
      from recent_events e
      join public.recipes r on r.id = e.resource_id
      cross join lateral unnest(r.tags) as t(tag)
      where trim(t.tag) <> ''
    ),
    aggregated as (
      select
        e.tag,
        count(distinct e.resource_id)::bigint as recent_recipe_count,
        count(*) filter (where e.activity_type = 'like')::bigint as recent_like_count,
        count(*) filter (where e.activity_type = 'bookmark')::bigint as recent_bookmark_count,
        count(*) filter (where e.activity_type = 'comment')::bigint as recent_comment_count,
        count(distinct e.user_id)::bigint as recent_participant_count,
        count(*)::bigint as recent_activity_count,
        max(e.created_at) as last_activity_at
      from tagged_events e
      group by e.tag
    ),
    totals as (
      select
        trim(t.tag) as tag,
        count(distinct r.id)::bigint as total_recipe_count
      from public.recipes r
      cross join lateral unnest(r.tags) as t(tag)
      where trim(t.tag) <> ''
      group by trim(t.tag)
    )
    select
      a.tag,
      a.recent_recipe_count,
      coalesce(t.total_recipe_count, 0)::bigint,
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
    left join totals t on t.tag = a.tag
    order by
      trend_score desc,
      a.recent_participant_count desc,
      a.recent_recipe_count desc,
      a.last_activity_at desc,
      a.tag
    limit greatest(1, least(coalesce(p_limit, 10), 50));
end;
$$;

comment on function public.get_trending_recipe_tags(text, integer) is
  '기간(day·week·month) 동안의 참여를 집계해 인기 레시피 태그 순위를 반환한다. 좋아요·북마크 RLS를 넘어 전체를 세려고 SECURITY DEFINER를 쓰며, 공개 정보와 합계만 반환하므로 anon 실행을 허용한다.';

-- 추천 검색 --------------------------------------------------------------------
-- 시그니처가 같으므로 CREATE OR REPLACE로 본체를 옮기고, 기존 실행 권한과 설명을 유지한다.

create or replace function public.search_recommendations(
  p_query_text text,
  p_query_embedding extensions.vector,
  p_embedding_model_id text,
  p_source_types text[] default array['recipe', 'combo']::text[],
  p_category text default null,
  p_difficulty text default null,
  p_max_time_minutes integer default null,
  p_tools_required boolean default null,
  p_include_ingredients text[] default '{}'::text[],
  p_exclude_ingredients text[] default '{}'::text[],
  p_match_count integer default 8
)
returns table (
  source_type text,
  source_id uuid,
  score double precision,
  keyword_rank bigint,
  semantic_rank bigint,
  semantic_similarity double precision
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_query_text text := btrim(coalesce(p_query_text, ''));
  v_embedding_model_id text := btrim(coalesce(p_embedding_model_id, ''));
  v_category text := nullif(btrim(p_category), '');
  v_difficulty text := nullif(btrim(p_difficulty), '');
  v_include_ingredients text[];
  v_exclude_ingredients text[];
  v_query tsquery;
  v_match_count integer := least(greatest(coalesce(p_match_count, 8), 1), 20);
  v_candidate_count integer := least(v_match_count * 3, 60);
begin
  if (select auth.uid()) is null
    and coalesce((select auth.jwt() ->> 'role'), '') <> 'service_role'
  then
    raise exception '추천 검색은 인증된 사용자 또는 서버에서만 사용할 수 있습니다.'
      using errcode = '42501';
  end if;

  if v_query_text = '' then
    raise exception '검색어가 필요합니다.'
      using errcode = '22023';
  end if;

  if p_query_embedding is null then
    raise exception '검색 임베딩이 필요합니다.'
      using errcode = '22023';
  end if;

  if v_embedding_model_id = '' then
    raise exception '임베딩 모델 ID가 필요합니다.'
      using errcode = '22023';
  end if;

  if p_source_types is null
    or cardinality(p_source_types) = 0
    or not (p_source_types <@ array['recipe', 'combo']::text[])
  then
    raise exception '검색 대상은 recipe 또는 combo여야 합니다.'
      using errcode = '22023';
  end if;

  if p_max_time_minutes is not null and p_max_time_minutes <= 0 then
    raise exception '최대 조리 시간은 1분 이상이어야 합니다.'
      using errcode = '22023';
  end if;

  select coalesce(array_agg(normalized.value order by normalized.value), '{}'::text[])
    into v_include_ingredients
    from (
      select distinct lower(btrim(value)) as value
      from unnest(coalesce(p_include_ingredients, '{}'::text[])) as input(value)
      where btrim(value) <> ''
    ) as normalized;

  select coalesce(array_agg(normalized.value order by normalized.value), '{}'::text[])
    into v_exclude_ingredients
    from (
      select distinct lower(btrim(value)) as value
      from unnest(coalesce(p_exclude_ingredients, '{}'::text[])) as input(value)
      where btrim(value) <> ''
    ) as normalized;

  if v_include_ingredients && v_exclude_ingredients then
    raise exception '같은 재료를 포함 조건과 제외 조건에 함께 사용할 수 없습니다.'
      using errcode = '22023';
  end if;

  v_query := websearch_to_tsquery('simple'::regconfig, v_query_text);

  return query
  with filtered as (
    select
      document.source_type,
      document.source_id,
      document.search_vector,
      document.embedding
    from private.recommendation_documents as document
    where document.embedding_status = 'ready'
      and document.embedding is not null
      and document.embedding_model = v_embedding_model_id
      and extensions.vector_dims(document.embedding)
        = extensions.vector_dims(p_query_embedding)
      and document.source_type = any(p_source_types)
      and (v_category is null or document.category = v_category)
      and (v_difficulty is null or document.difficulty = v_difficulty)
      and (
        p_max_time_minutes is null
        or document.time_minutes <= p_max_time_minutes
      )
      and (
        p_tools_required is null
        or document.tools_required = p_tools_required
      )
      and document.ingredient_names @> v_include_ingredients
      and not (document.ingredient_names && v_exclude_ingredients)
  ),
  keyword_results as (
    select
      candidate.source_type,
      candidate.source_id,
      row_number() over (
        order by
          ts_rank_cd(candidate.search_vector, v_query) desc,
          candidate.source_type,
          candidate.source_id
      ) as rank_position
    from filtered as candidate
    where candidate.search_vector @@ v_query
    order by
      ts_rank_cd(candidate.search_vector, v_query) desc,
      candidate.source_type,
      candidate.source_id
    limit v_candidate_count
  ),
  semantic_results as (
    select
      candidate.source_type,
      candidate.source_id,
      row_number() over (
        order by
          candidate.embedding operator(extensions.<=>) p_query_embedding,
          candidate.source_type,
          candidate.source_id
      ) as rank_position,
      1 - (
        candidate.embedding operator(extensions.<=>) p_query_embedding
      ) as similarity
    from filtered as candidate
    order by
      candidate.embedding operator(extensions.<=>) p_query_embedding,
      candidate.source_type,
      candidate.source_id
    limit v_candidate_count
  ),
  fused as (
    select
      coalesce(keyword.source_type, semantic.source_type) as source_type,
      coalesce(keyword.source_id, semantic.source_id) as source_id,
      (
        coalesce(1.0 / (50.0 + keyword.rank_position), 0.0)
        + coalesce(1.0 / (50.0 + semantic.rank_position), 0.0)
      )::double precision as score,
      keyword.rank_position as keyword_rank,
      semantic.rank_position as semantic_rank,
      semantic.similarity as semantic_similarity
    from keyword_results as keyword
    full outer join semantic_results as semantic
      on semantic.source_type = keyword.source_type
      and semantic.source_id = keyword.source_id
  )
  select
    result.source_type,
    result.source_id,
    result.score,
    result.keyword_rank,
    result.semantic_rank,
    result.semantic_similarity
  from fused as result
  order by result.score desc, result.source_type, result.source_id
  limit v_match_count;
end;
$$;

-- 옛 함수 삭제 -------------------------------------------------------------------

drop function public.get_trending_recipes_by_period(text, integer);
drop function public.get_trending_combos_by_period(text, integer);
drop function public.get_trending_posts_by_period(text, integer);
drop function public.get_trending_recipe_tags_by_period(text, integer);
drop function private.get_trending_recipes_by_period(text, integer);
drop function private.get_trending_combos_by_period(text, integer);
drop function private.get_trending_posts_by_period(text, integer);
drop function private.get_trending_recipe_tags_by_period(text, integer);
drop function private.search_recommendations_internal(
  text, extensions.vector, text, text[], text, text, integer, boolean, text[], text[], integer
);

-- 실행 권한 ----------------------------------------------------------------------

revoke all on function
  public.get_trending_recipes(text, integer),
  public.get_trending_combos(text, integer),
  public.get_trending_posts(text, integer),
  public.get_trending_recipe_tags(text, integer)
from public;

grant execute on function
  public.get_trending_recipes(text, integer),
  public.get_trending_combos(text, integer),
  public.get_trending_posts(text, integer),
  public.get_trending_recipe_tags(text, integer)
to anon, authenticated, service_role;

-- 기간 검증 함수는 위 SECURITY DEFINER 함수 안에서 소유자 권한으로만 호출된다.
revoke all on function private.trending_window_start(text) from public, anon, authenticated, service_role;

-- anon이 private 스키마를 쓰던 곳은 트렌딩 껍데기뿐이었다.
-- authenticated는 RLS 정책의 private.is_admin() 때문에 USAGE를 유지한다.
revoke usage on schema private from anon;
