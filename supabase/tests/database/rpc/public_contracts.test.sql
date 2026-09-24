begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(57);

-- 외부에서 사용하는 RPC 목록과 실행 권한을 계약으로 고정합니다.
select extensions.is(
  (
    select array_agg(
      format('%s(%s)', rpc.proname, pg_catalog.pg_get_function_identity_arguments(rpc.oid))
      order by rpc.proname
    )
    from pg_proc rpc
    join pg_namespace rpc_schema on rpc_schema.oid = rpc.pronamespace
    where rpc_schema.nspname = 'public'
      and rpc.proname = any (array[
        'get_trending_combos_by_period', 'get_trending_posts_by_period',
        'get_trending_recipe_tags_by_period', 'get_trending_recipes_by_period',
        'increment_combo_view', 'increment_post_view', 'increment_recipe_view',
        'is_current_user_admin', 'set_combo_bookmark', 'set_combo_like', 'set_follow',
        'set_post_bookmark', 'set_post_like', 'set_recipe_bookmark', 'set_recipe_like'
      ])
  ),
  array[
    'get_trending_combos_by_period(period text, limit_size integer)',
    'get_trending_posts_by_period(period text, limit_size integer)',
    'get_trending_recipe_tags_by_period(period text, limit_size integer)',
    'get_trending_recipes_by_period(period text, limit_size integer)',
    'increment_combo_view(p_combo_id uuid)',
    'increment_post_view(p_post_id uuid)',
    'increment_recipe_view(p_recipe_id uuid)',
    'is_current_user_admin()',
    'set_combo_bookmark(p_combo_id uuid, p_bookmarked boolean)',
    'set_combo_like(p_combo_id uuid, p_liked boolean)',
    'set_follow(p_target_id uuid, p_following boolean)',
    'set_post_bookmark(p_post_id uuid, p_bookmarked boolean)',
    'set_post_like(p_post_id uuid, p_liked boolean)',
    'set_recipe_bookmark(p_recipe_id uuid, p_bookmarked boolean)',
    'set_recipe_like(p_recipe_id uuid, p_liked boolean)'
  ]::text[],
  '애플리케이션이 사용하는 공개 RPC 시그니처가 유지된다'
);

select extensions.ok(
  (
    select bool_and(not has_function_privilege('anon', rpc.oid, 'EXECUTE'))
    from pg_proc rpc
    join pg_namespace rpc_schema on rpc_schema.oid = rpc.pronamespace
    where rpc_schema.nspname = 'public'
      and rpc.proname like 'set_%'
  ),
  '익명 사용자는 좋아요·북마크·팔로우 RPC를 실행할 수 없다'
);

select extensions.ok(
  (
    select bool_and(has_function_privilege('authenticated', rpc.oid, 'EXECUTE'))
    from pg_proc rpc
    join pg_namespace rpc_schema on rpc_schema.oid = rpc.pronamespace
    where rpc_schema.nspname = 'public'
      and rpc.proname like 'set_%'
  ),
  '로그인 사용자는 좋아요·북마크·팔로우 RPC를 실행할 수 있다'
);

select extensions.ok(
  (
    select bool_and(has_function_privilege('anon', rpc.oid, 'EXECUTE'))
    from pg_proc rpc
    join pg_namespace rpc_schema on rpc_schema.oid = rpc.pronamespace
    where rpc_schema.nspname = 'public'
      and rpc.proname in ('increment_post_view', 'increment_recipe_view', 'increment_combo_view')
  ),
  '익명 사용자도 조회수 RPC를 실행할 수 있다'
);

select extensions.ok(
  (
    select bool_and(has_function_privilege('anon', rpc.oid, 'EXECUTE'))
    from pg_proc rpc
    join pg_namespace rpc_schema on rpc_schema.oid = rpc.pronamespace
    where rpc_schema.nspname = 'public'
      and rpc.proname like 'get_trending_%_by_period'
  ),
  '익명 사용자도 기간별 트렌딩 RPC를 실행할 수 있다'
);

select extensions.is(
  (
    select count(*)::integer
    from pg_proc rpc
    join pg_namespace rpc_schema on rpc_schema.oid = rpc.pronamespace
    where rpc_schema.nspname in ('public', 'private')
      and rpc.proname like 'get_trending_%_7d'
  ),
  0,
  '제거한 7일 고정 트렌딩 RPC가 다시 생기지 않는다'
);

select extensions.is(
  (
    select count(*)::integer
    from pg_proc rpc
    join pg_namespace rpc_schema on rpc_schema.oid = rpc.pronamespace
    where rpc_schema.nspname = 'public'
      and rpc.proname like 'set_%'
      and rpc.prosecdef
  ),
  7,
  '직접 쓰기 권한을 대신하는 참여 RPC는 SECURITY DEFINER다'
);

select extensions.is(
  (
    select count(*)::integer
    from pg_proc rpc
    join pg_namespace rpc_schema on rpc_schema.oid = rpc.pronamespace
    where rpc_schema.nspname = 'public'
      and rpc.proname like 'set_%'
      and 'search_path=""' = any(rpc.proconfig)
  ),
  7,
  '참여 SECURITY DEFINER RPC는 빈 search_path를 사용한다'
);

select extensions.is(
  (
    select count(*)::integer
    from pg_proc rpc
    join pg_namespace rpc_schema on rpc_schema.oid = rpc.pronamespace
    where rpc_schema.nspname = 'private'
      and rpc.proname like 'get_trending_%_by_period'
      and rpc.prosecdef
  ),
  4,
  '비공개 트렌딩 집계 함수는 SECURITY DEFINER다'
);

select extensions.is(
  (
    select count(*)::integer
    from pg_proc rpc
    join pg_namespace rpc_schema on rpc_schema.oid = rpc.pronamespace
    where rpc_schema.nspname = 'public'
      and rpc.proname like 'get_trending_%_by_period'
      and not rpc.prosecdef
  ),
  4,
  '공개 트렌딩 래퍼는 호출자 권한을 유지한다'
);

select extensions.ok(
  has_schema_privilege('anon', 'private', 'USAGE')
  and has_schema_privilege('authenticated', 'private', 'USAGE'),
  '공개 트렌딩 래퍼가 private 함수를 찾을 수 있다'
);

set local role anon;

select extensions.throws_ok(
  $$ select * from public.get_trending_recipes_by_period('year', 10) $$,
  '22023',
  'unsupported trending period: year',
  '레시피 트렌딩은 지원하지 않는 기간을 오류로 거부한다'
);

select extensions.throws_ok(
  $$ select * from public.get_trending_combos_by_period('year', 10) $$,
  '22023',
  'unsupported trending period: year',
  '조합 트렌딩은 지원하지 않는 기간을 오류로 거부한다'
);

select extensions.throws_ok(
  $$ select * from public.get_trending_posts_by_period('year', 10) $$,
  '22023',
  'unsupported trending period: year',
  '게시글 트렌딩은 지원하지 않는 기간을 오류로 거부한다'
);

select extensions.throws_ok(
  $$ select * from public.get_trending_recipe_tags_by_period('year', 10) $$,
  '22023',
  'unsupported trending period: year',
  '레시피 태그 트렌딩은 지원하지 않는 기간을 오류로 거부한다'
);

reset role;

-- RPC 동작 검증용 사용자와 콘텐츠입니다.
insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at
)
values
  (
    '11000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
    'rpc-user-a@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"RPC 사용자 A"}', now(), now(), now()
  ),
  (
    '11000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
    'rpc-user-b@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"RPC 사용자 B"}', now(), now(), now()
  );

insert into public.posts (id, title, writer_uid, writer_name, category)
values ('21000000-0000-4000-8000-000000000001', 'RPC 게시글', '11000000-0000-4000-8000-000000000001', 'RPC 사용자 A', 'free');

insert into public.recipes (id, title, image, steps, ingredients, writer_uid, writer_name)
values ('31000000-0000-4000-8000-000000000001', 'RPC 레시피', 'recipes/test/rpc.jpg', '[]', '[]', '11000000-0000-4000-8000-000000000001', 'RPC 사용자 A');

insert into public.combos (id, title, items, writer_uid, writer_name)
values ('41000000-0000-4000-8000-000000000001', 'RPC 조합', '[]', '11000000-0000-4000-8000-000000000001', 'RPC 사용자 A');

select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"11000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select extensions.lives_ok(
  $$ select * from public.set_post_like('21000000-0000-4000-8000-000000000001', true) $$,
  '게시글 좋아요 RPC를 실행할 수 있다'
);
reset role;
select extensions.is(
  (select exists (select 1 from public.post_likes where user_id = '11000000-0000-4000-8000-000000000001' and post_id = '21000000-0000-4000-8000-000000000001')::text || ':' || like_count::text from public.posts where id = '21000000-0000-4000-8000-000000000001'),
  'true:1',
  '게시글 좋아요 추가 결과와 카운터가 일치한다'
);

set local role authenticated;
select extensions.lives_ok($$ select * from public.set_post_like('21000000-0000-4000-8000-000000000001', false) $$, '게시글 좋아요 해제 RPC를 실행할 수 있다');
reset role;
select extensions.is((select exists (select 1 from public.post_likes where user_id = '11000000-0000-4000-8000-000000000001' and post_id = '21000000-0000-4000-8000-000000000001')::text || ':' || like_count::text from public.posts where id = '21000000-0000-4000-8000-000000000001'), 'false:0', '게시글 좋아요 해제 결과와 카운터가 일치한다');

set local role authenticated;
select extensions.lives_ok($$ select * from public.set_recipe_like('31000000-0000-4000-8000-000000000001', true) $$, '레시피 좋아요 RPC를 실행할 수 있다');
reset role;
select extensions.is((select exists (select 1 from public.recipe_likes where user_id = '11000000-0000-4000-8000-000000000001' and recipe_id = '31000000-0000-4000-8000-000000000001')::text || ':' || like_count::text from public.recipes where id = '31000000-0000-4000-8000-000000000001'), 'true:1', '레시피 좋아요 추가 결과와 카운터가 일치한다');

set local role authenticated;
select extensions.lives_ok($$ select * from public.set_recipe_like('31000000-0000-4000-8000-000000000001', false) $$, '레시피 좋아요 해제 RPC를 실행할 수 있다');
reset role;
select extensions.is((select exists (select 1 from public.recipe_likes where user_id = '11000000-0000-4000-8000-000000000001' and recipe_id = '31000000-0000-4000-8000-000000000001')::text || ':' || like_count::text from public.recipes where id = '31000000-0000-4000-8000-000000000001'), 'false:0', '레시피 좋아요 해제 결과와 카운터가 일치한다');

set local role authenticated;
select extensions.lives_ok($$ select * from public.set_combo_like('41000000-0000-4000-8000-000000000001', true) $$, '조합 좋아요 RPC를 실행할 수 있다');
reset role;
select extensions.is((select exists (select 1 from public.combo_likes where user_id = '11000000-0000-4000-8000-000000000001' and combo_id = '41000000-0000-4000-8000-000000000001')::text || ':' || like_count::text from public.combos where id = '41000000-0000-4000-8000-000000000001'), 'true:1', '조합 좋아요 추가 결과와 카운터가 일치한다');

set local role authenticated;
select extensions.lives_ok($$ select * from public.set_combo_like('41000000-0000-4000-8000-000000000001', false) $$, '조합 좋아요 해제 RPC를 실행할 수 있다');
reset role;
select extensions.is((select exists (select 1 from public.combo_likes where user_id = '11000000-0000-4000-8000-000000000001' and combo_id = '41000000-0000-4000-8000-000000000001')::text || ':' || like_count::text from public.combos where id = '41000000-0000-4000-8000-000000000001'), 'false:0', '조합 좋아요 해제 결과와 카운터가 일치한다');

-- 북마크 RPC도 좋아요와 같은 상태 지정 방식으로 처리합니다.
set local role authenticated;
select extensions.lives_ok($$ select * from public.set_post_bookmark('21000000-0000-4000-8000-000000000001', true) $$, '게시글 북마크 RPC를 실행할 수 있다');
reset role;
select extensions.is((select exists (select 1 from public.post_bookmarks where user_id = '11000000-0000-4000-8000-000000000001' and post_id = '21000000-0000-4000-8000-000000000001')::text || ':' || bookmark_count::text from public.posts where id = '21000000-0000-4000-8000-000000000001'), 'true:1', '게시글 북마크 추가 결과와 카운터가 일치한다');

set local role authenticated;
select extensions.lives_ok($$ select * from public.set_post_bookmark('21000000-0000-4000-8000-000000000001', false) $$, '게시글 북마크 해제 RPC를 실행할 수 있다');
reset role;
select extensions.is((select exists (select 1 from public.post_bookmarks where user_id = '11000000-0000-4000-8000-000000000001' and post_id = '21000000-0000-4000-8000-000000000001')::text || ':' || bookmark_count::text from public.posts where id = '21000000-0000-4000-8000-000000000001'), 'false:0', '게시글 북마크 해제 결과와 카운터가 일치한다');

set local role authenticated;
select extensions.lives_ok($$ select * from public.set_recipe_bookmark('31000000-0000-4000-8000-000000000001', true) $$, '레시피 북마크 RPC를 실행할 수 있다');
reset role;
select extensions.is((select exists (select 1 from public.recipe_bookmarks where user_id = '11000000-0000-4000-8000-000000000001' and recipe_id = '31000000-0000-4000-8000-000000000001')::text || ':' || bookmark_count::text from public.recipes where id = '31000000-0000-4000-8000-000000000001'), 'true:1', '레시피 북마크 추가 결과와 카운터가 일치한다');

set local role authenticated;
select extensions.lives_ok($$ select * from public.set_recipe_bookmark('31000000-0000-4000-8000-000000000001', false) $$, '레시피 북마크 해제 RPC를 실행할 수 있다');
reset role;
select extensions.is((select exists (select 1 from public.recipe_bookmarks where user_id = '11000000-0000-4000-8000-000000000001' and recipe_id = '31000000-0000-4000-8000-000000000001')::text || ':' || bookmark_count::text from public.recipes where id = '31000000-0000-4000-8000-000000000001'), 'false:0', '레시피 북마크 해제 결과와 카운터가 일치한다');

set local role authenticated;
select extensions.lives_ok($$ select * from public.set_combo_bookmark('41000000-0000-4000-8000-000000000001', true) $$, '조합 북마크 RPC를 실행할 수 있다');
reset role;
select extensions.is((select exists (select 1 from public.combo_bookmarks where user_id = '11000000-0000-4000-8000-000000000001' and combo_id = '41000000-0000-4000-8000-000000000001')::text || ':' || bookmark_count::text from public.combos where id = '41000000-0000-4000-8000-000000000001'), 'true:1', '조합 북마크 추가 결과와 카운터가 일치한다');

set local role authenticated;
select extensions.lives_ok($$ select * from public.set_combo_bookmark('41000000-0000-4000-8000-000000000001', false) $$, '조합 북마크 해제 RPC를 실행할 수 있다');
reset role;
select extensions.is((select exists (select 1 from public.combo_bookmarks where user_id = '11000000-0000-4000-8000-000000000001' and combo_id = '41000000-0000-4000-8000-000000000001')::text || ':' || bookmark_count::text from public.combos where id = '41000000-0000-4000-8000-000000000001'), 'false:0', '조합 북마크 해제 결과와 카운터가 일치한다');

-- 팔로우 RPC는 관계 행과 양쪽 프로필 카운터를 한 번에 맞춰야 합니다.
set local role authenticated;
select extensions.lives_ok($$ select * from public.set_follow('11000000-0000-4000-8000-000000000002', true) $$, '팔로우 RPC를 실행할 수 있다');
reset role;
select extensions.is(
  (select exists (select 1 from public.user_follows where follower_id = '11000000-0000-4000-8000-000000000001' and following_id = '11000000-0000-4000-8000-000000000002')::text || ':' || follower_count::text || ':' || (select following_count from public.profiles where id = '11000000-0000-4000-8000-000000000001')::text from public.profiles where id = '11000000-0000-4000-8000-000000000002'),
  'true:1:1',
  '팔로우 추가 결과와 양쪽 카운터가 일치한다'
);

set local role authenticated;
select extensions.lives_ok($$ select * from public.set_follow('11000000-0000-4000-8000-000000000002', false) $$, '언팔로우 RPC를 실행할 수 있다');
reset role;
select extensions.is(
  (select exists (select 1 from public.user_follows where follower_id = '11000000-0000-4000-8000-000000000001' and following_id = '11000000-0000-4000-8000-000000000002')::text || ':' || follower_count::text || ':' || (select following_count from public.profiles where id = '11000000-0000-4000-8000-000000000001')::text from public.profiles where id = '11000000-0000-4000-8000-000000000002'),
  'false:0:0',
  '언팔로우 결과와 양쪽 카운터가 일치한다'
);

-- 조회수 RPC는 로그인 없이도 원자적으로 1씩 증가합니다.
set local role anon;
select extensions.lives_ok($$ select public.increment_post_view('21000000-0000-4000-8000-000000000001') $$, '게시글 조회수 RPC를 익명으로 실행할 수 있다');
reset role;
select extensions.is((select view_count from public.posts where id = '21000000-0000-4000-8000-000000000001'), 1, '게시글 조회수가 1 증가한다');

set local role anon;
select extensions.lives_ok($$ select public.increment_recipe_view('31000000-0000-4000-8000-000000000001') $$, '레시피 조회수 RPC를 익명으로 실행할 수 있다');
reset role;
select extensions.is((select view_count from public.recipes where id = '31000000-0000-4000-8000-000000000001'), 1, '레시피 조회수가 1 증가한다');

set local role anon;
select extensions.lives_ok($$ select public.increment_combo_view('41000000-0000-4000-8000-000000000001') $$, '조합 조회수 RPC를 익명으로 실행할 수 있다');
reset role;
select extensions.is((select view_count from public.combos where id = '41000000-0000-4000-8000-000000000001'), 1, '조합 조회수가 1 증가한다');

-- 트렌딩 정렬: 점수 → 고유 참여자 → 북마크 → ID 순서를 검증합니다.
insert into public.recipes (id, title, image, steps, ingredients, tags, writer_uid, writer_name)
select recipe_id, '트렌딩 ' || recipe_id::text, 'recipes/test/trending.jpg', '[]', '[]', array['테스트'], '11000000-0000-4000-8000-000000000001', 'RPC 사용자 A'
from unnest(array[
  '51000000-0000-4000-8000-000000000001'::uuid,
  '51000000-0000-4000-8000-000000000002'::uuid,
  '51000000-0000-4000-8000-000000000003'::uuid,
  '51000000-0000-4000-8000-000000000004'::uuid,
  '51000000-0000-4000-8000-000000000005'::uuid,
  '51000000-0000-4000-8000-000000000006'::uuid,
  '51000000-0000-4000-8000-000000000007'::uuid
]) as recipe_id;

-- 1번: 북마크 2개 = 26점, 2번: 좋아요 1개+댓글 1개 = 26점
insert into public.recipe_bookmarks (user_id, recipe_id, created_at) values
  ('11000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001', now() - interval '1 hour'),
  ('11000000-0000-4000-8000-000000000002', '51000000-0000-4000-8000-000000000001', now() - interval '1 hour');
insert into public.recipe_likes (user_id, recipe_id, created_at) values
  ('11000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000002', now() - interval '1 hour'),
  ('11000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000003', now() - interval '1 hour'),
  ('11000000-0000-4000-8000-000000000002', '51000000-0000-4000-8000-000000000003', now() - interval '1 hour'),
  ('11000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000004', now() - interval '1 hour'),
  ('11000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000005', now() - interval '1 hour'),
  ('11000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000006', now() - interval '1 hour'),
  ('11000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000007', now() - interval '2 days');

insert into public.comments (id, recipe_id, writer_uid, writer_name, content, created_at) values
  ('61000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000002', '11000000-0000-4000-8000-000000000002', 'RPC 사용자 B', '댓글', now() - interval '1 hour'),
  ('61000000-0000-4000-8000-000000000002', '51000000-0000-4000-8000-000000000004', '11000000-0000-4000-8000-000000000001', 'RPC 사용자 A', '댓글 1', now() - interval '1 hour'),
  ('61000000-0000-4000-8000-000000000003', '51000000-0000-4000-8000-000000000004', '11000000-0000-4000-8000-000000000001', 'RPC 사용자 A', '댓글 2', now() - interval '1 hour'),
  ('61000000-0000-4000-8000-000000000004', '51000000-0000-4000-8000-000000000004', '11000000-0000-4000-8000-000000000001', 'RPC 사용자 A', '댓글 3', now() - interval '1 hour');

set local role anon;
select extensions.lives_ok($$ select * from public.get_trending_recipes_by_period('day', 10) $$, '레시피 트렌딩 RPC를 익명으로 실행할 수 있다');
select extensions.lives_ok($$ select * from public.get_trending_combos_by_period('day', 10) $$, '조합 트렌딩 RPC를 익명으로 실행할 수 있다');
select extensions.lives_ok($$ select * from public.get_trending_posts_by_period('day', 10) $$, '게시글 트렌딩 RPC를 익명으로 실행할 수 있다');
select extensions.lives_ok($$ select * from public.get_trending_recipe_tags_by_period('day', 10) $$, '태그 트렌딩 RPC를 익명으로 실행할 수 있다');
reset role;

select extensions.is(
  (
    select array_agg(id)
    from public.get_trending_recipes_by_period('day', 50)
    where id::text like '51000000-%'
  ),
  array[
    '51000000-0000-4000-8000-000000000001'::uuid,
    '51000000-0000-4000-8000-000000000002'::uuid,
    '51000000-0000-4000-8000-000000000003'::uuid,
    '51000000-0000-4000-8000-000000000004'::uuid,
    '51000000-0000-4000-8000-000000000005'::uuid,
    '51000000-0000-4000-8000-000000000006'::uuid
  ],
  '트렌딩 결과는 점수·참여자·북마크·ID 우선순위로 정렬된다'
);

select extensions.ok(
  not exists (
    select 1 from public.get_trending_recipes_by_period('day', 50)
    where id = '51000000-0000-4000-8000-000000000007'
  ),
  '24시간보다 오래된 활동은 일간 트렌딩에서 제외된다'
);

select extensions.ok(
  exists (
    select 1 from public.get_trending_recipes_by_period('week', 50)
    where id = '51000000-0000-4000-8000-000000000007'
  ),
  '7일 이내 활동은 주간 트렌딩에 포함된다'
);

select extensions.is(
  (select count(*)::integer from public.get_trending_recipes_by_period('day', 0)),
  1,
  '트렌딩 요청 개수의 최솟값은 1이다'
);

select * from extensions.finish();
rollback;
