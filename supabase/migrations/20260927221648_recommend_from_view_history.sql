-- 맞춤 추천: 사용자가 본 레시피·조합(브라우저 세션의 조회 기록)을 바탕으로 비슷한 레시피·조합을 고른다.
--
-- 가중치 = 1 + 0.5 × min(본 횟수 - 1, 3) + 좋아요 1 + 북마크 1.5 (1.0 ~ 5.0)
--   본 횟수는 브라우저가 보낸 값이다. 조작해도 그 사용자 본인의 추천만 바뀐다.
--   좋아요·북마크는 서버가 세션에서 확인해 넘긴 p_user_id로 DB에서 직접 확인한다.
--
-- 추천 문서는 같은 틀의 텍스트로 만들어져 서로의 코사인 유사도가 0.85~0.97에 몰려 있다.
-- 같은 모델 문서 전체의 평균 벡터를 빼고(중심화) 비교하면 순위 간격이 약 10배 벌어지고
-- 의미 없는 테스트 문서가 상위에 섞이는 비율이 36.7%에서 5.0%로 줄었다(2026-09-28 더미 48건 실험).
create or replace function public.recommend_from_view_history(
  p_items jsonb,
  p_embedding_model_id text,
  p_user_id uuid default null,
  p_source_types text[] default array['recipe', 'combo'],
  p_match_count integer default 5
)
returns table (
  source_type text,
  source_id uuid,
  similarity double precision
)
language plpgsql
stable
security invoker
set search_path to ''
as $function$
#variable_conflict use_column
declare
  v_match_count integer := least(greatest(coalesce(p_match_count, 5), 1), 20);
  v_item jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'p_items는 JSON 배열이어야 합니다.' using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) > 20 then
    raise exception '조회 기록은 최대 20개까지 받습니다.' using errcode = '22023';
  end if;

  if p_embedding_model_id is null or length(btrim(p_embedding_model_id)) = 0 then
    raise exception 'p_embedding_model_id가 필요합니다.' using errcode = '22023';
  end if;

  if p_source_types is null
    or cardinality(p_source_types) = 0
    or not (p_source_types <@ array['recipe', 'combo']::text[])
  then
    raise exception 'p_source_types는 recipe, combo 중 하나 이상이어야 합니다.' using errcode = '22023';
  end if;

  -- 항목 형식: { "sourceType": "recipe" | "combo", "sourceId": uuid, "viewCount": 정수 | null | 생략 }
  for v_item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) <> 'object'
      or coalesce(v_item->>'sourceType', '') not in ('recipe', 'combo')
      or coalesce(v_item->>'sourceId', '')
        !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or coalesce(jsonb_typeof(v_item->'viewCount'), 'null') not in ('number', 'null')
      or (
        jsonb_typeof(v_item->'viewCount') = 'number'
        and (v_item->>'viewCount')::numeric <> trunc((v_item->>'viewCount')::numeric)
      )
    then
      raise exception '조회 기록 항목 형식이 올바르지 않습니다: %', v_item using errcode = '22023';
    end if;
  end loop;

  return query
  with items as (
    -- 같은 항목이 여러 번 오면 본 횟수가 큰 쪽을 쓴다. 1보다 작은 값은 1로 본다.
    select
      item->>'sourceType' as item_type,
      (item->>'sourceId')::uuid as item_id,
      max(greatest(coalesce((item->>'viewCount')::numeric, 1), 1)) as view_count
    from jsonb_array_elements(p_items) as item
    group by 1, 2
  ),
  documents as (
    -- 다른 모델로 만든 벡터는 같은 공간의 좌표가 아니므로 섞지 않는다.
    select document.source_type, document.source_id, document.embedding
    from private.recommendation_documents as document
    where document.embedding_status = 'ready'
      and document.embedding is not null
      and document.embedding_model = p_embedding_model_id
  ),
  centroid as (
    select extensions.avg(documents.embedding) as mean_embedding
    from documents
  ),
  centered as (
    select
      documents.source_type,
      documents.source_id,
      extensions.l2_normalize(
        documents.embedding operator(extensions.-) centroid.mean_embedding
      ) as embedding
    from documents
    cross join centroid
  ),
  weighted as (
    select
      centered.embedding,
      (
        1
        + 0.5 * least(items.view_count - 1, 3)
        + case
            when p_user_id is not null and (
              (items.item_type = 'recipe' and exists (
                select 1 from public.recipe_likes as liked
                where liked.user_id = p_user_id and liked.recipe_id = items.item_id
              ))
              or (items.item_type = 'combo' and exists (
                select 1 from public.combo_likes as liked
                where liked.user_id = p_user_id and liked.combo_id = items.item_id
              ))
            ) then 1
            else 0
          end
        + case
            when p_user_id is not null and (
              (items.item_type = 'recipe' and exists (
                select 1 from public.recipe_bookmarks as bookmarked
                where bookmarked.user_id = p_user_id and bookmarked.recipe_id = items.item_id
              ))
              or (items.item_type = 'combo' and exists (
                select 1 from public.combo_bookmarks as bookmarked
                where bookmarked.user_id = p_user_id and bookmarked.combo_id = items.item_id
              ))
            ) then 1.5
            else 0
          end
      )::real as weight
    from items
    join centered
      on centered.source_type = items.item_type
      and centered.source_id = items.item_id
  ),
  query as (
    -- 코사인 유사도는 방향만 보므로 가중 평균 대신 가중 합을 쓴다.
    select extensions.sum(
      weighted.embedding operator(extensions.*) array_fill(
        weighted.weight,
        array[extensions.vector_dims(weighted.embedding)]
      )::extensions.vector
    ) as embedding
    from weighted
  )
  select
    candidate.source_type,
    candidate.source_id,
    (1 - (candidate.embedding operator(extensions.<=>) query.embedding))::double precision
  from centered as candidate
  cross join query
  where query.embedding is not null
    and extensions.vector_norm(query.embedding) > 0
    and extensions.vector_norm(candidate.embedding) > 0
    and candidate.source_type = any(p_source_types)
    and not exists (
      select 1
      from items
      where items.item_type = candidate.source_type
        and items.item_id = candidate.source_id
    )
  order by
    candidate.embedding operator(extensions.<=>) query.embedding,
    candidate.source_type,
    candidate.source_id
  limit v_match_count;
end;
$function$;

-- private 추천 문서를 읽는 함수이므로 서버 전용 service_role에만 실행 권한을 준다.
revoke all on function public.recommend_from_view_history(jsonb, text, uuid, text[], integer)
  from public, anon, authenticated, service_role;
grant execute on function public.recommend_from_view_history(jsonb, text, uuid, text[], integer)
  to service_role;

comment on function public.recommend_from_view_history(jsonb, text, uuid, text[], integer) is
  '세션 조회 기록(최대 20개)을 본 횟수·좋아요·북마크로 가중 합산하고, 추천 문서 평균을 뺀 벡터로 비슷한 레시피·조합을 고른다. 이미 본 항목은 제외하고 ID와 유사도만 반환한다. 서버 전용: 서버가 세션에서 확인한 사용자 ID를 p_user_id로 넘긴다.';
