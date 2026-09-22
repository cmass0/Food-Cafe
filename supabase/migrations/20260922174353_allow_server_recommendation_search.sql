-- 공개 채팅 API는 비로그인 사용자를 받되, 추천 검색 RPC를 anon 역할에 직접 노출하지 않는다.
-- 서버의 service_role 클라이언트와 기존 로그인 사용자만 공개 래퍼를 실행할 수 있다.
create or replace function private.search_recommendations_internal(
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
set search_path to ''
as $function$
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
$function$;

revoke all on function public.search_recommendations(
  text,
  extensions.vector,
  text,
  text[],
  text,
  text,
  integer,
  boolean,
  text[],
  text[],
  integer
) from public, anon, authenticated, service_role;

grant execute on function public.search_recommendations(
  text,
  extensions.vector,
  text,
  text[],
  text,
  text,
  integer,
  boolean,
  text[],
  text[],
  integer
) to authenticated, service_role;

comment on function public.search_recommendations(
  text,
  extensions.vector,
  text,
  text[],
  text,
  text,
  integer,
  boolean,
  text[],
  text[],
  integer
) is '로그인 사용자 또는 공개 채팅 서버가 레시피와 콤보의 FTS·벡터 검색 순위를 조회한다.';
