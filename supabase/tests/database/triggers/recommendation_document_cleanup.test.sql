begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(5);

select extensions.is(
  (
    select count(*)::integer
    from pg_trigger
    where not tgisinternal
      and tgenabled <> 'D'
      and (
        (tgrelid = 'public.recipes'::regclass and tgname = 'recipes_delete_recommendation_document')
        or (tgrelid = 'public.combos'::regclass and tgname = 'combos_delete_recommendation_document')
      )
  ),
  2,
  '레시피와 조합 삭제 시 추천 문서를 정리하는 Trigger가 활성화되어 있다'
);

insert into public.recipes (id, title, steps, image)
values (
  '92000000-0000-4000-8000-000000000001',
  '추천 색인 정리 테스트 레시피',
  '[{"description":"재료를 섞는다"}]'::jsonb,
  'test-image'
);

insert into public.combos (id, title)
values ('92000000-0000-4000-8000-000000000002', '추천 색인 정리 테스트 조합');

insert into private.recommendation_documents
  (source_type, source_id, search_text, content_hash)
values
  ('recipe', '92000000-0000-4000-8000-000000000001', '테스트 레시피', 'test-recipe'),
  ('combo', '92000000-0000-4000-8000-000000000002', '테스트 조합', 'test-combo');

select extensions.is(
  (select count(*)::integer from private.recommendation_documents where source_id in (
    '92000000-0000-4000-8000-000000000001',
    '92000000-0000-4000-8000-000000000002'
  )),
  2,
  '원본 두 건에 대한 추천 문서가 준비된다'
);

delete from public.recipes where id = '92000000-0000-4000-8000-000000000001';

select extensions.is(
  (select count(*)::integer from private.recommendation_documents where source_id = '92000000-0000-4000-8000-000000000001'),
  0,
  '레시피 삭제 시 해당 추천 문서가 함께 삭제된다'
);

select extensions.is(
  (select count(*)::integer from private.recommendation_documents where source_id = '92000000-0000-4000-8000-000000000002'),
  1,
  '레시피 삭제는 다른 조합의 추천 문서를 지우지 않는다'
);

delete from public.combos where id = '92000000-0000-4000-8000-000000000002';

select extensions.is(
  (select count(*)::integer from private.recommendation_documents where source_id = '92000000-0000-4000-8000-000000000002'),
  0,
  '조합 삭제 시 해당 추천 문서가 함께 삭제된다'
);

select * from extensions.finish();
rollback;
