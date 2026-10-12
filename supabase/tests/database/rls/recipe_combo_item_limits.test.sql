begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(28);

-- 규칙: 로그인 사용자가 앱 서버를 거치지 않고 Supabase API로 직접 써도 레시피·조합의 개수·항목 길이·카테고리·
-- 숫자 범위는 앱과 같은 상한에서 막힌다. 거절 메시지로 어느 제약이 막았는지까지 확인한다.
-- 로컬 테스트 DB에서만 실행한다. 모든 변경은 끝에서 롤백한다.

insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values (
  '96000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'item-limit-writer@test.local',
  '{"display_name":"항목 상한 작성자"}', now(), now()
);

select extensions.ok(
  not has_function_privilege('anon', 'private.text_items_within(text[], integer, integer)', 'execute')
    and not has_function_privilege('anon', 'private.jsonb_field_within(jsonb, text, integer)', 'execute'),
  '제약 검사 함수는 쓰기 권한이 없는 anon에게 실행 권한을 주지 않는다'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"96000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

-- 레시피

select extensions.lives_ok(
  $$
    insert into public.recipes (
      id, title, steps, ingredients, image, images, tags, tools, category, servings, time_minutes, writer_uid
    )
    select
      '96000000-0000-4000-8000-000000000011',
      '상한 레시피',
      jsonb_build_array(jsonb_build_object('description', repeat('가', 500))),
      (
        select jsonb_agg(jsonb_build_object(
          'name', repeat('가', 200),
          'amount', repeat('가', 100),
          'unit', repeat('가', 50),
          'unitCustom', repeat('가', 100)
        ))
        from generate_series(1, 200)
      ),
      repeat('a', 2048),
      array(select repeat('a', 2048) from generate_series(1, 10)),
      array(select repeat('가', 49) || g % 10 from generate_series(1, 10) as g),
      array(select repeat('나', 49) || g % 10 from generate_series(1, 10) as g),
      '기타',
      50,
      0,
      '96000000-0000-4000-8000-000000000001'
  $$,
  '레시피는 앱 상한(태그·도구·사진 10개, 재료 200개, 항목 최대 길이, 인분 50, 조리 0분)까지 저장한다'
);

select extensions.lives_ok(
  $$
    update public.recipes set category = '', servings = 1
    where id = '96000000-0000-4000-8000-000000000011'
  $$,
  '카테고리를 고르지 않은 빈 값과 1인분은 저장한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, image, tags, writer_uid)
    select '태그 11개', '[{"description":"볶는다"}]', 'test-image',
      array(select '태그' || g from generate_series(1, 11) as g),
      '96000000-0000-4000-8000-000000000001'
  $$,
  '23514',
  'new row for relation "recipes" violates check constraint "recipes_tags_items"',
  '레시피 태그 11개는 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, image, tags, writer_uid)
    values ('태그 51자', '[{"description":"볶는다"}]', 'test-image', array[repeat('가', 51)],
      '96000000-0000-4000-8000-000000000001')
  $$,
  '23514',
  'new row for relation "recipes" violates check constraint "recipes_tags_items"',
  '레시피 태그 하나가 51자면 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, image, tags, writer_uid)
    values ('빈 태그', '[{"description":"볶는다"}]', 'test-image', array['매운맛', E' \t'],
      '96000000-0000-4000-8000-000000000001')
  $$,
  '23514',
  'new row for relation "recipes" violates check constraint "recipes_tags_items"',
  '공백뿐인 태그는 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, image, tools, writer_uid)
    select '도구 11개', '[{"description":"볶는다"}]', 'test-image',
      array(select '도구' || g from generate_series(1, 11) as g),
      '96000000-0000-4000-8000-000000000001'
  $$,
  '23514',
  'new row for relation "recipes" violates check constraint "recipes_tools_items"',
  '레시피 조리도구 11개는 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, image, images, writer_uid)
    select '사진 11장', '[{"description":"볶는다"}]', 'test-image',
      array(select 'recipes/u/r/' || g || '.jpg' from generate_series(1, 11) as g),
      '96000000-0000-4000-8000-000000000001'
  $$,
  '23514',
  'new row for relation "recipes" violates check constraint "recipes_images_items"',
  '레시피 사진 11장은 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, image, writer_uid)
    values ('긴 대표 사진', '[{"description":"볶는다"}]', repeat('a', 2049),
      '96000000-0000-4000-8000-000000000001')
  $$,
  '23514',
  'new row for relation "recipes" violates check constraint "recipes_image_length"',
  '대표 사진 경로가 2049자면 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, ingredients, image, writer_uid)
    select '재료 201개', '[{"description":"볶는다"}]',
      jsonb_agg(jsonb_build_object('name', '양파', 'amount', '1', 'unit', '개')),
      'test-image', '96000000-0000-4000-8000-000000000001'
    from generate_series(1, 201)
  $$,
  '23514',
  'new row for relation "recipes" violates check constraint "recipes_ingredients_count"',
  '재료 201개는 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, ingredients, image, writer_uid)
    values (
      '긴 재료명', '[{"description":"볶는다"}]',
      jsonb_build_array(jsonb_build_object('name', repeat('가', 201), 'amount', '1', 'unit', '개')),
      'test-image', '96000000-0000-4000-8000-000000000001'
    )
  $$,
  '23514',
  'new row for relation "recipes" violates check constraint "recipes_ingredients_item_length"',
  '재료명이 201자면 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, image, writer_uid)
    values (
      '긴 단계',
      jsonb_build_array(jsonb_build_object('description', '볶는다'), jsonb_build_object('description', repeat('가', 501))),
      'test-image', '96000000-0000-4000-8000-000000000001'
    )
  $$,
  '23514',
  'new row for relation "recipes" violates check constraint "recipes_steps_item_length"',
  '레시피 단계 하나가 501자면 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, image, category, writer_uid)
    values ('목록 밖 카테고리', '[{"description":"볶는다"}]', 'test-image', '아무거나',
      '96000000-0000-4000-8000-000000000001')
  $$,
  '23514',
  'new row for relation "recipes" violates check constraint "recipes_category_allowed"',
  '목록 밖 카테고리는 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, image, servings, writer_uid)
    values ('0인분', '[{"description":"볶는다"}]', 'test-image', 0, '96000000-0000-4000-8000-000000000001')
  $$,
  '23514',
  'new row for relation "recipes" violates check constraint "recipes_servings_range"',
  '0인분은 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, image, servings, writer_uid)
    values ('51인분', '[{"description":"볶는다"}]', 'test-image', 51, '96000000-0000-4000-8000-000000000001')
  $$,
  '23514',
  'new row for relation "recipes" violates check constraint "recipes_servings_range"',
  '51인분은 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, image, time_minutes, writer_uid)
    values ('음수 시간', '[{"description":"볶는다"}]', 'test-image', -1, '96000000-0000-4000-8000-000000000001')
  $$,
  '23514',
  'new row for relation "recipes" violates check constraint "recipes_time_minutes_nonnegative"',
  '조리 시간이 음수면 거절한다'
);

select extensions.throws_ok(
  $$
    update public.recipes
    set tags = array(select '태그' || g from generate_series(1, 11) as g)
    where id = '96000000-0000-4000-8000-000000000011'
  $$,
  '23514',
  'new row for relation "recipes" violates check constraint "recipes_tags_items"',
  '자기 레시피여도 태그를 11개로 바꿀 수 없다'
);

select extensions.is(
  (select cardinality(tags) from public.recipes where id = '96000000-0000-4000-8000-000000000011'),
  10,
  '거절된 수정은 저장된 태그를 바꾸지 않는다'
);

-- 조합

select extensions.lives_ok(
  $$
    insert into public.combos (id, title, steps, items, image, tags, tools, time_minutes, writer_uid)
    select
      '96000000-0000-4000-8000-000000000021',
      '상한 조합',
      jsonb_build_array(jsonb_build_object('description', repeat('가', 500))),
      (
        select jsonb_agg(
          case when g % 2 = 0 then jsonb_build_object(
            'type', 'recipe',
            'recipeid', '96000000-0000-4000-8000-000000000011',
            'title', repeat('가', 200),
            'summary', repeat('가', 500),
            'image', repeat('a', 2048)
          ) else jsonb_build_object(
            'type', 'product',
            'productName', repeat('가', 200),
            'summary', repeat('가', 500),
            'image', repeat('a', 2048)
          ) end
        )
        from generate_series(1, 10) as g
      ),
      repeat('a', 2048),
      array(select repeat('가', 48) || g from generate_series(10, 29) as g),
      array(select repeat('나', 48) || g from generate_series(10, 29) as g),
      1,
      '96000000-0000-4000-8000-000000000001'
  $$,
  '조합은 앱 상한(태그·도구 20개, 항목 10개, 항목 최대 길이, 조리 1분)까지 저장한다'
);

select extensions.throws_ok(
  $$
    insert into public.combos (title, tags, writer_uid)
    select '태그 21개', array(select '태그' || g from generate_series(1, 21) as g),
      '96000000-0000-4000-8000-000000000001'
  $$,
  '23514',
  'new row for relation "combos" violates check constraint "combos_tags_items"',
  '조합 태그 21개는 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.combos (title, tools, writer_uid)
    select '도구 21개', array(select '도구' || g from generate_series(1, 21) as g),
      '96000000-0000-4000-8000-000000000001'
  $$,
  '23514',
  'new row for relation "combos" violates check constraint "combos_tools_items"',
  '조합 조리도구 21개는 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.combos (title, items, writer_uid)
    select '항목 11개', jsonb_agg(jsonb_build_object('type', 'product', 'productName', '김밥')),
      '96000000-0000-4000-8000-000000000001'
    from generate_series(1, 11)
  $$,
  '23514',
  'new row for relation "combos" violates check constraint "combos_items_count"',
  '조합 항목 11개는 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.combos (title, items, writer_uid)
    values (
      '긴 상품명',
      jsonb_build_array(
        jsonb_build_object('type', 'product', 'productName', '김밥'),
        jsonb_build_object('type', 'product', 'productName', repeat('가', 201))
      ),
      '96000000-0000-4000-8000-000000000001'
    )
  $$,
  '23514',
  'new row for relation "combos" violates check constraint "combos_items_item_length"',
  '조합 상품명이 201자면 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.combos (title, steps, writer_uid)
    values ('긴 단계', jsonb_build_array(jsonb_build_object('description', repeat('가', 501))),
      '96000000-0000-4000-8000-000000000001')
  $$,
  '23514',
  'new row for relation "combos" violates check constraint "combos_steps_item_length"',
  '조합 단계 하나가 501자면 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.combos (title, time_minutes, writer_uid)
    values ('0분', 0, '96000000-0000-4000-8000-000000000001')
  $$,
  '23514',
  'new row for relation "combos" violates check constraint "combos_time_minutes_positive"',
  '조합 조리 시간 0분은 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.combos (title, image, writer_uid)
    values ('긴 대표 사진', repeat('a', 2049), '96000000-0000-4000-8000-000000000001')
  $$,
  '23514',
  'new row for relation "combos" violates check constraint "combos_image_length"',
  '조합 대표 사진 경로가 2049자면 거절한다'
);

select extensions.throws_ok(
  $$
    update public.combos
    set steps = jsonb_build_array(jsonb_build_object('description', repeat('가', 501)))
    where id = '96000000-0000-4000-8000-000000000021'
  $$,
  '23514',
  'new row for relation "combos" violates check constraint "combos_steps_item_length"',
  '자기 조합이어도 단계를 501자로 바꿀 수 없다'
);

select extensions.is(
  (
    select char_length(steps -> 0 ->> 'description') from public.combos
    where id = '96000000-0000-4000-8000-000000000021'
  ),
  500,
  '거절된 수정은 저장된 단계를 바꾸지 않는다'
);

reset role;

select * from extensions.finish();

rollback;
