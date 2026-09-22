-- 원본을 어떤 경로(API, 서버 액션, 직접 SQL)로 삭제해도 파생 검색 문서를 남기지 않는다.
create or replace function private.delete_recommendation_document_for_source()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  delete from private.recommendation_documents
  where source_type = tg_argv[0]
    and source_id = old.id;

  return old;
end;
$function$;

revoke all on function private.delete_recommendation_document_for_source()
  from public, anon, authenticated, service_role;

create trigger recipes_delete_recommendation_document
after delete on public.recipes
for each row execute function private.delete_recommendation_document_for_source('recipe');

create trigger combos_delete_recommendation_document
after delete on public.combos
for each row execute function private.delete_recommendation_document_for_source('combo');
