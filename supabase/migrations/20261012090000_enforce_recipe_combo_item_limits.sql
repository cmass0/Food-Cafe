-- 레시피·조합의 개수·항목 길이·카테고리·숫자 범위를 DB에서도 강제한다.
--
-- 로그인 사용자는 앱 서버를 거치지 않고 Supabase API로 자기 레시피·조합의 컬럼을 직접 쓸 수 있다(컬럼 단위 권한 + RLS).
-- 20261004030000은 제목 같은 글자 수와 JSON 전체 크기만 막아서, 태그·도구·사진·재료·조합 항목의 개수,
-- 단계·재료 항목 하나의 글자 수, 카테고리, 인분·조리 시간은 앱 규칙(Zod)에만 있었다.
-- 직접 쓰면 태그 1,000개, 수천 자짜리 단계, 목록 밖 카테고리, -5인분이 저장되고 다른 사용자 화면에 그대로 보였다.
-- 앱 규칙과 같은 숫자로 막아, 앱을 거치든 직접 쓰든 같은 선에서 거절한다.
--
-- 배열 원소 하나하나는 CHECK 식에서 바로 셀 수 없어(서브쿼리 불가) 입력 값만 보는 불변 함수로 센다.
-- 앱은 UTF-16으로, DB는 코드 포인트로 세서 이모지가 있으면 앱이 먼저 막는다. 앱이 허용한 값을 DB가 거절하지는 않는다.

create function private.text_items_within(items text[], max_count integer, max_chars integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(items) <= max_count
    and not exists (
      select 1
      from unnest(items) as item
      where item is null or item ~ '^\s*$' or char_length(item) > max_chars
    );
$$;

comment on function private.text_items_within(text[], integer, integer) is
  '문자열 배열이 max_count개 이하이고, 원소마다 비어 있지 않으며 max_chars자 이하인지 본다. 태그·도구·사진 경로 CHECK 제약용. 배열이 NULL이면 NULL(제약 통과).';

create function private.jsonb_field_within(items jsonb, field text, max_chars integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(items) <> 'array'
    or not exists (
      select 1
      from jsonb_array_elements(items) as item
      where char_length(item ->> field) > max_chars
    );
$$;

comment on function private.jsonb_field_within(jsonb, text, integer) is
  'JSON 배열의 원소마다 field 값이 max_chars자 이하인지 본다. 단계·재료·조합 항목 CHECK 제약용. field가 없는 원소는 통과한다.';

-- 제약을 검사하는 역할은 쓰는 쪽이다. 직접 쓰는 로그인 사용자와 서버·시드용 service_role이 실행할 수 있어야 한다.
revoke execute on function private.text_items_within(text[], integer, integer) from public;
revoke execute on function private.jsonb_field_within(jsonb, text, integer) from public;
grant execute on function private.text_items_within(text[], integer, integer) to authenticated, service_role;
grant execute on function private.jsonb_field_within(jsonb, text, integer) to authenticated, service_role;

alter table public.recipes
  add constraint recipes_category_allowed check (
    category is null or category = any (array[
      '', '한식', '고기·구이', '분식', '중식', '일식', '양식',
      '아시안', '샐러드·건강식', '디저트·베이킹', '간식·야식', '기타'
    ])
  ),
  add constraint recipes_tags_items check (private.text_items_within(tags, 10, 50)),
  add constraint recipes_tools_items check (private.text_items_within(tools, 10, 50)),
  add constraint recipes_images_items check (private.text_items_within(images, 10, 2048)),
  add constraint recipes_image_length check (char_length(image) <= 2048),
  add constraint recipes_ingredients_count check (
    jsonb_typeof(ingredients) <> 'array' or jsonb_array_length(ingredients) <= 200
  ),
  add constraint recipes_ingredients_item_length check (
    private.jsonb_field_within(ingredients, 'name', 200)
    and private.jsonb_field_within(ingredients, 'amount', 100)
    and private.jsonb_field_within(ingredients, 'unit', 50)
    and private.jsonb_field_within(ingredients, 'unitCustom', 100)
  ),
  add constraint recipes_steps_item_length check (private.jsonb_field_within(steps, 'description', 500)),
  add constraint recipes_servings_range check (servings between 1 and 50),
  add constraint recipes_time_minutes_nonnegative check (time_minutes >= 0);

comment on constraint recipes_category_allowed on public.recipes is
  '카테고리는 빈 값(선택 안 함) 또는 목록 값만. 앱 목록(domain/recipe/category.ts RECIPE_CATEGORIES)과 같은 값. 목록 밖 값은 카테고리 필터에서 빠진다.';
comment on constraint recipes_tags_items on public.recipes is
  '태그 10개 이하, 태그마다 1~50자. 앱 규칙(domain/recipe/schema.ts MAX_RECIPE_TAGS, lib/domain/schema.ts tagSchema)과 같은 값.';
comment on constraint recipes_tools_items on public.recipes is
  '조리도구 10개 이하, 항목마다 1~50자. 앱 규칙(MAX_RECIPE_TOOLS, tagSchema)과 같은 값.';
comment on constraint recipes_images_items on public.recipes is
  '사진 10장 이하, 경로마다 2048자 이하. 앱 규칙(domain/recipe/schema.ts 사진 목록)과 같은 값.';
comment on constraint recipes_image_length on public.recipes is
  '대표 사진 경로 2048자 이하. 앱 규칙(lib/domain/schema.ts imageFieldSchema)과 같은 값.';
comment on constraint recipes_ingredients_count on public.recipes is
  '재료 200개 이하. 앱 규칙(domain/recipe/schema.ts MAX_RECIPE_INGREDIENTS)과 같은 값.';
comment on constraint recipes_ingredients_item_length on public.recipes is
  '재료 항목 글자 수(이름 200·수량 100·단위 50·직접 입력 단위 100). 앱 규칙(INGREDIENT_TEXT_LIMITS)과 같은 값.';
comment on constraint recipes_steps_item_length on public.recipes is
  '조리 단계 하나 500자 이하. 앱 규칙(MAX_RECIPE_STEP_CHARS)과 같은 값. 단계 개수·JSON 전체 크기는 recipes_steps_count·recipes_steps_size가 막는다.';
comment on constraint recipes_servings_range on public.recipes is
  '인분 1~50. 앱 규칙(domain/recipe/schema.ts servings)과 같은 값.';
comment on constraint recipes_time_minutes_nonnegative on public.recipes is
  '조리 시간 0분 이상. 앱 규칙(domain/recipe/schema.ts time_minutes)과 같은 값.';

alter table public.combos
  add constraint combos_tags_items check (private.text_items_within(tags, 20, 50)),
  add constraint combos_tools_items check (private.text_items_within(tools, 20, 50)),
  add constraint combos_image_length check (char_length(image) <= 2048),
  add constraint combos_items_count check (jsonb_typeof(items) <> 'array' or jsonb_array_length(items) <= 10),
  add constraint combos_items_item_length check (
    private.jsonb_field_within(items, 'title', 200)
    and private.jsonb_field_within(items, 'summary', 500)
    and private.jsonb_field_within(items, 'productName', 200)
    and private.jsonb_field_within(items, 'image', 2048)
  ),
  add constraint combos_steps_item_length check (private.jsonb_field_within(steps, 'description', 500)),
  add constraint combos_time_minutes_positive check (time_minutes >= 1);

comment on constraint combos_tags_items on public.combos is
  '태그 20개 이하, 태그마다 1~50자. 앱 규칙(domain/combo/schema.ts tags, lib/domain/schema.ts tagSchema)과 같은 값.';
comment on constraint combos_tools_items on public.combos is
  '조리도구 20개 이하, 항목마다 1~50자. 앱 규칙(domain/combo/schema.ts tools, tagSchema)과 같은 값.';
comment on constraint combos_image_length on public.combos is
  '대표 사진 경로 2048자 이하. 앱 규칙(lib/domain/schema.ts imageFieldSchema)과 같은 값.';
comment on constraint combos_items_count on public.combos is
  '조합 항목 10개 이하. 앱 규칙(domain/combo/schema.ts MAX_COMBO_ITEMS)과 같은 값.';
comment on constraint combos_items_item_length on public.combos is
  '조합 항목 글자 수(제목 200·요약 500·상품명 200·사진 경로 2048). 앱 규칙(COMBO_ITEM_TEXT_LIMITS, imageFieldSchema)과 같은 값.';
comment on constraint combos_steps_item_length on public.combos is
  '조합 단계 하나 500자 이하. 앱 규칙(MAX_COMBO_STEP_CHARS)과 같은 값. 단계 개수·JSON 전체 크기는 combos_steps_count·combos_steps_size가 막는다.';
comment on constraint combos_time_minutes_positive on public.combos is
  '조리 시간 1분 이상. 앱 규칙(domain/combo/schema.ts time_minutes)과 같은 값.';
