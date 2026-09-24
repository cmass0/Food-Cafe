begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(16);

-- 구조: 공통 로직은 클라이언트가 직접 호출할 수 없고, 입구 함수만 로그인 사용자에게 열려 있습니다.
select extensions.ok(
  not has_function_privilege('authenticated', 'private.set_relation(text, text, text, text, uuid, boolean)', 'EXECUTE')
  and not has_function_privilege('anon', 'private.set_relation(text, text, text, text, uuid, boolean)', 'EXECUTE'),
  '공통 관계 함수는 anon·authenticated가 직접 실행할 수 없다'
);

select extensions.ok(
  not has_function_privilege('anon', 'public.set_recipe_like(uuid, boolean)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.set_follow(uuid, boolean)', 'EXECUTE'),
  '익명 사용자는 관계 지정 RPC를 실행할 수 없다'
);

select extensions.is(
  (
    select array_agg(column_name::text order by ordinal_position)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'recipe_bookmarks'
  ),
  array['user_id', 'recipe_id', 'created_at']::text[],
  '레시피 북마크는 다른 관계 테이블과 같은 컬럼 구조를 가진다'
);

select extensions.is(
  (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conrelid = 'public.recipe_bookmarks'::regclass and contype = 'p'
  ),
  'PRIMARY KEY (user_id, recipe_id)',
  '레시피 북마크의 기본키는 (user_id, recipe_id)다'
);

-- 동작 검증용 사용자와 콘텐츠입니다.
insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at
)
values
  (
    '13000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
    'setter-user-a@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"관계 사용자 A"}', now(), now(), now()
  ),
  (
    '13000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
    'setter-user-b@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"관계 사용자 B"}', now(), now(), now()
  );

insert into public.recipes (id, title, image, steps, ingredients, writer_uid)
values ('33000000-0000-4000-8000-000000000001', '관계 레시피', 'recipes/test/setter.jpg', '[]', '[]', '13000000-0000-4000-8000-000000000002');

select set_config('request.jwt.claim.sub', '13000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"13000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

-- 같은 상태를 두 번 요청해도 관계 행과 개수는 한 번만 반영됩니다.
select extensions.is(
  (select liked::text || ':' || like_count::text from public.set_recipe_like('33000000-0000-4000-8000-000000000001', true)),
  'true:1',
  '좋아요를 지정하면 상태와 개수를 반환한다'
);

select extensions.is(
  (select liked::text || ':' || like_count::text from public.set_recipe_like('33000000-0000-4000-8000-000000000001', true)),
  'true:1',
  '좋아요를 다시 지정해도 개수가 늘지 않는다'
);

select extensions.is(
  (select liked::text || ':' || like_count::text from public.set_recipe_like('33000000-0000-4000-8000-000000000001', false)),
  'false:0',
  '좋아요 해제를 지정하면 상태와 개수를 반환한다'
);

select extensions.is(
  (select liked::text || ':' || like_count::text from public.set_recipe_like('33000000-0000-4000-8000-000000000001', false)),
  'false:0',
  '좋아요 해제를 다시 지정해도 개수가 음수가 되지 않는다'
);

select extensions.is(
  (select bookmarked::text || ':' || bookmark_count::text from public.set_recipe_bookmark('33000000-0000-4000-8000-000000000001', true)),
  'true:1',
  '레시피 북마크도 상태 지정 방식으로 동작한다'
);

select extensions.is(
  (select bookmarked::text || ':' || bookmark_count::text from public.set_recipe_bookmark('33000000-0000-4000-8000-000000000001', true)),
  'true:1',
  '레시피 북마크를 다시 지정해도 개수가 늘지 않는다'
);

-- 대상이 없으면 오류 대신 빈 결과를 반환하고 아무것도 남기지 않습니다.
select extensions.is(
  (select count(*)::integer from public.set_post_like('00000000-0000-4000-8000-000000000000', true)),
  0,
  '없는 대상에는 빈 결과를 반환한다'
);

select extensions.throws_ok(
  $$ select * from public.set_recipe_like('33000000-0000-4000-8000-000000000001', null) $$,
  '22004',
  'STATE_REQUIRED',
  '원하는 상태 없이 호출하면 거부한다'
);

select extensions.throws_ok(
  $$ select * from public.set_follow('13000000-0000-4000-8000-000000000001', true) $$,
  '22023',
  'CANNOT_FOLLOW_SELF',
  '자기 자신은 팔로우할 수 없다'
);

select extensions.is(
  (select following::text || ':' || follower_count::text || ':' || following_count::text
   from public.set_follow('13000000-0000-4000-8000-000000000002', true)),
  'true:1:1',
  '팔로우를 지정하면 양쪽 카운터를 반환한다'
);

select extensions.is(
  (select following::text || ':' || follower_count::text || ':' || following_count::text
   from public.set_follow('13000000-0000-4000-8000-000000000002', true)),
  'true:1:1',
  '팔로우를 다시 지정해도 카운터가 늘지 않는다'
);

reset role;

select extensions.is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'recipe_likes', 'recipe_bookmarks', 'post_likes', 'post_bookmarks',
        'combo_likes', 'combo_bookmarks', 'user_follows'
      )
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  ),
  0,
  '관계 테이블에는 쓰기 정책이 없다(쓰기는 RPC로만 한다)'
);

select * from extensions.finish();
rollback;
