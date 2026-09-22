-- 추천 문서 원본은 private 스키마에 두고, 서버의 service_role만 상태 조회와 일괄 저장을 수행한다.
create or replace function public.get_recommendation_document_states()
returns table (
  source_type text,
  source_id uuid,
  content_hash text,
  embedding_model text,
  embedding_status text
)
language sql
stable
security invoker
set search_path to ''
as $function$
  select
    document.source_type,
    document.source_id,
    document.content_hash,
    document.embedding_model,
    document.embedding_status
  from private.recommendation_documents as document;
$function$;

create or replace function public.upsert_recommendation_documents(
  p_documents jsonb
)
returns integer
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_affected integer;
begin
  if jsonb_typeof(p_documents) <> 'array'
    or jsonb_array_length(p_documents) = 0
    or jsonb_array_length(p_documents) > 100
  then
    raise exception '추천 문서는 1개 이상 100개 이하의 배열이어야 합니다.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_documents) as document(
      source_type text,
      source_id uuid
    )
    where document.source_type not in ('recipe', 'combo')
      or (
        document.source_type = 'recipe'
        and not exists (
          select 1 from public.recipes where recipes.id = document.source_id
        )
      )
      or (
        document.source_type = 'combo'
        and not exists (
          select 1 from public.combos where combos.id = document.source_id
        )
      )
  ) then
    raise exception '존재하지 않거나 지원하지 않는 추천 원본이 포함되어 있습니다.'
      using errcode = '22023';
  end if;

  insert into private.recommendation_documents (
    source_type,
    source_id,
    search_text,
    embedding,
    category,
    difficulty,
    time_minutes,
    tools_required,
    ingredient_names,
    content_hash,
    embedding_model,
    embedding_status,
    embedding_error,
    embedded_at
  )
  select
    document.source_type,
    document.source_id,
    document.search_text,
    case
      when document.embedding is null then null
      else document.embedding::extensions.vector
    end,
    document.category,
    document.difficulty,
    document.time_minutes,
    coalesce(document.tools_required, false),
    coalesce(document.ingredient_names, '{}'::text[]),
    document.content_hash,
    document.embedding_model,
    document.embedding_status,
    document.embedding_error,
    case when document.embedding_status = 'ready' then now() else null end
  from jsonb_to_recordset(p_documents) as document(
    source_type text,
    source_id uuid,
    search_text text,
    embedding text,
    category text,
    difficulty text,
    time_minutes integer,
    tools_required boolean,
    ingredient_names text[],
    content_hash text,
    embedding_model text,
    embedding_status text,
    embedding_error text
  )
  on conflict (source_type, source_id) do update
  set
    search_text = excluded.search_text,
    embedding = excluded.embedding,
    category = excluded.category,
    difficulty = excluded.difficulty,
    time_minutes = excluded.time_minutes,
    tools_required = excluded.tools_required,
    ingredient_names = excluded.ingredient_names,
    content_hash = excluded.content_hash,
    embedding_model = excluded.embedding_model,
    embedding_status = excluded.embedding_status,
    embedding_error = excluded.embedding_error,
    embedded_at = excluded.embedded_at;

  get diagnostics v_affected = row_count;
  return v_affected;
end;
$function$;

revoke all on function public.get_recommendation_document_states()
  from public, anon, authenticated, service_role;
revoke all on function public.upsert_recommendation_documents(jsonb)
  from public, anon, authenticated, service_role;

grant execute on function public.get_recommendation_document_states()
  to service_role;
grant execute on function public.upsert_recommendation_documents(jsonb)
  to service_role;
