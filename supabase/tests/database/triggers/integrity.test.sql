begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(33);

-- 앱 서버를 거친 요청처럼 서버 확인 헤더를 붙인다. 헤더 없는 직접 요청 차단은 rls/app_server_content_writes.test.sql이 확인한다.
delete from vault.secrets where name = 'app_server_key';
select vault.create_secret('pgtap-app-server-key', 'app_server_key');
select set_config('request.headers', '{"x-app-server-key":"pgtap-app-server-key"}', true);

-- 프로젝트가 의존하는 Trigger의 존재와 활성 상태를 검증합니다.
select extensions.is(
  (
    with expected(schema_name, table_name, trigger_name) as (
      values
        ('auth', 'users', 'on_auth_user_created'),
        ('public', 'combo_bookmarks', 'trg_combo_bookmarks_sync_count'),
        ('public', 'combo_likes', 'trg_combo_likes_sync_count'),
        ('public', 'combos', 'trg_combos_set_updated_at'),
        ('public', 'combos', 'trg_combos_set_writer'),
        ('public', 'comments', 'trg_comments_set_updated_at'),
        ('public', 'comments', 'trg_comments_set_writer'),
        ('public', 'comments', 'trg_comments_sync_parent_count'),
        ('public', 'post_bookmarks', 'trg_post_bookmarks_sync_count'),
        ('public', 'post_likes', 'trg_post_likes_sync_count'),
        ('public', 'posts', 'trg_posts_set_updated_at'),
        ('public', 'posts', 'trg_posts_set_writer'),
        ('public', 'profiles', 'trg_profiles_set_updated_at'),
        ('public', 'recipe_bookmarks', 'trg_recipe_bookmarks_sync_count'),
        ('public', 'recipe_likes', 'trg_recipe_likes_sync_count'),
        ('public', 'recipes', 'trg_recipes_set_updated_at'),
        ('public', 'recipes', 'trg_recipes_set_writer'),
        ('public', 'user_follows', 'trg_user_follows_sync_count')
    )
    select count(*)::integer
    from expected
    join pg_namespace trigger_schema on trigger_schema.nspname = expected.schema_name
    join pg_class trigger_table
      on trigger_table.relnamespace = trigger_schema.oid
      and trigger_table.relname = expected.table_name
    join pg_trigger app_trigger
      on app_trigger.tgrelid = trigger_table.oid
      and app_trigger.tgname = expected.trigger_name
      and not app_trigger.tgisinternal
  ),
  18,
  '필수 애플리케이션 Trigger 18개가 존재한다'
);

select extensions.ok(
  not exists (
    select 1
    from pg_trigger app_trigger
    join pg_class trigger_table on trigger_table.oid = app_trigger.tgrelid
    join pg_namespace trigger_schema on trigger_schema.oid = trigger_table.relnamespace
    where not app_trigger.tgisinternal
      and trigger_schema.nspname in ('public', 'auth')
      and trigger_table.relname in (
        'users', 'profiles', 'recipes', 'combos', 'posts', 'comments',
        'recipe_likes', 'recipe_bookmarks', 'post_likes', 'post_bookmarks',
        'combo_likes', 'combo_bookmarks', 'user_follows'
      )
      and app_trigger.tgenabled = 'D'
  ),
  '애플리케이션 Trigger가 모두 활성화되어 있다'
);

insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at
)
values
  (
    '12000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
    'trigger-user-a@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"Trigger 사용자 A"}', now(), now(), now()
  ),
  (
    '12000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
    'trigger-user-b@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"Trigger 사용자 B"}', now(), now(), now()
  );

select extensions.is(
  (select count(*)::integer from public.profiles where id in ('12000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000002')),
  2,
  'Auth 사용자 생성 시 공개 프로필이 자동 생성된다'
);

select extensions.is(
  (select count(*)::integer from private.user_roles where user_id in ('12000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000002') and role = 'user'),
  2,
  'Auth 사용자 생성 시 기본 역할이 자동 생성된다'
);

select extensions.ok(
  (select prosecdef from pg_proc where oid = 'private.handle_new_user()'::regprocedure),
  '회원 생성 Trigger 함수는 SECURITY DEFINER다'
);

select extensions.is(
  (
    select count(*)::integer
    from pg_proc trigger_function
    join pg_namespace function_schema on function_schema.oid = trigger_function.pronamespace
    where function_schema.nspname = 'private'
      and trigger_function.proname in ('sync_engagement_count', 'sync_follow_count')
      and trigger_function.prosecdef
  ),
  2,
  '참여 카운터 Trigger 함수는 권한 우회가 필요한 SECURITY DEFINER다'
);

select extensions.ok(
  (select prosecdef from pg_proc where oid = 'private.set_content_writer()'::regprocedure),
  '콘텐츠 작성자 지정 Trigger 함수는 SECURITY DEFINER다'
);

select extensions.ok(
  coalesce((
    select 'search_path=""' = any(trigger_function.proconfig)
    from pg_proc trigger_function
    where trigger_function.oid = 'private.set_updated_at()'::regprocedure
  ), false),
  '공통 updated_at Trigger 함수는 빈 search_path를 사용한다'
);

insert into public.posts (id, title, writer_uid, writer_name, category, updated_at)
values ('22000000-0000-4000-8000-000000000001', 'Trigger 게시글', '12000000-0000-4000-8000-000000000001', 'Trigger 사용자 A', 'free', '2000-01-01');

insert into public.recipes (id, title, image, steps, ingredients, writer_uid, writer_name, updated_at)
values ('32000000-0000-4000-8000-000000000001', 'Trigger 레시피', 'recipes/test/trigger.jpg', '[]', '[]', '12000000-0000-4000-8000-000000000001', 'Trigger 사용자 A', '2000-01-01');

insert into public.combos (id, title, items, writer_uid, writer_name, updated_at)
values ('42000000-0000-4000-8000-000000000001', 'Trigger 조합', '[]', '12000000-0000-4000-8000-000000000001', 'Trigger 사용자 A', '2000-01-01');

-- 관계 행의 추가·삭제가 부모 집계값과 같은 트랜잭션에서 동기화됩니다.
insert into public.post_likes (user_id, post_id) values ('12000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000001');
select extensions.is((select like_count from public.posts where id = '22000000-0000-4000-8000-000000000001'), 1, '게시글 좋아요 추가 시 카운터가 증가한다');
delete from public.post_likes where user_id = '12000000-0000-4000-8000-000000000001' and post_id = '22000000-0000-4000-8000-000000000001';
select extensions.is((select like_count from public.posts where id = '22000000-0000-4000-8000-000000000001'), 0, '게시글 좋아요 삭제 시 카운터가 감소한다');

insert into public.post_bookmarks (user_id, post_id) values ('12000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000001');
select extensions.is((select bookmark_count from public.posts where id = '22000000-0000-4000-8000-000000000001'), 1, '게시글 북마크 추가 시 카운터가 증가한다');
delete from public.post_bookmarks where user_id = '12000000-0000-4000-8000-000000000001' and post_id = '22000000-0000-4000-8000-000000000001';
select extensions.is((select bookmark_count from public.posts where id = '22000000-0000-4000-8000-000000000001'), 0, '게시글 북마크 삭제 시 카운터가 감소한다');

insert into public.recipe_likes (user_id, recipe_id) values ('12000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001');
select extensions.is((select like_count from public.recipes where id = '32000000-0000-4000-8000-000000000001'), 1, '레시피 좋아요 추가 시 카운터가 증가한다');
delete from public.recipe_likes where user_id = '12000000-0000-4000-8000-000000000001' and recipe_id = '32000000-0000-4000-8000-000000000001';
select extensions.is((select like_count from public.recipes where id = '32000000-0000-4000-8000-000000000001'), 0, '레시피 좋아요 삭제 시 카운터가 감소한다');

insert into public.recipe_bookmarks (user_id, recipe_id) values ('12000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001');
select extensions.is((select bookmark_count from public.recipes where id = '32000000-0000-4000-8000-000000000001'), 1, '레시피 북마크 추가 시 카운터가 증가한다');
delete from public.recipe_bookmarks where user_id = '12000000-0000-4000-8000-000000000001' and recipe_id = '32000000-0000-4000-8000-000000000001';
select extensions.is((select bookmark_count from public.recipes where id = '32000000-0000-4000-8000-000000000001'), 0, '레시피 북마크 삭제 시 카운터가 감소한다');

insert into public.combo_likes (user_id, combo_id) values ('12000000-0000-4000-8000-000000000001', '42000000-0000-4000-8000-000000000001');
select extensions.is((select like_count from public.combos where id = '42000000-0000-4000-8000-000000000001'), 1, '조합 좋아요 추가 시 카운터가 증가한다');
delete from public.combo_likes where user_id = '12000000-0000-4000-8000-000000000001' and combo_id = '42000000-0000-4000-8000-000000000001';
select extensions.is((select like_count from public.combos where id = '42000000-0000-4000-8000-000000000001'), 0, '조합 좋아요 삭제 시 카운터가 감소한다');

insert into public.combo_bookmarks (user_id, combo_id) values ('12000000-0000-4000-8000-000000000001', '42000000-0000-4000-8000-000000000001');
select extensions.is((select bookmark_count from public.combos where id = '42000000-0000-4000-8000-000000000001'), 1, '조합 북마크 추가 시 카운터가 증가한다');
delete from public.combo_bookmarks where user_id = '12000000-0000-4000-8000-000000000001' and combo_id = '42000000-0000-4000-8000-000000000001';
select extensions.is((select bookmark_count from public.combos where id = '42000000-0000-4000-8000-000000000001'), 0, '조합 북마크 삭제 시 카운터가 감소한다');

insert into public.user_follows (follower_id, following_id) values ('12000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000002');
select extensions.is(
  (select follower_count::text || ':' || (select following_count from public.profiles where id = '12000000-0000-4000-8000-000000000001')::text from public.profiles where id = '12000000-0000-4000-8000-000000000002'),
  '1:1',
  '팔로우 추가 시 대상과 요청자의 카운터가 함께 증가한다'
);
delete from public.user_follows where follower_id = '12000000-0000-4000-8000-000000000001' and following_id = '12000000-0000-4000-8000-000000000002';
select extensions.is(
  (select follower_count::text || ':' || (select following_count from public.profiles where id = '12000000-0000-4000-8000-000000000001')::text from public.profiles where id = '12000000-0000-4000-8000-000000000002'),
  '0:0',
  '팔로우 삭제 시 대상과 요청자의 카운터가 함께 감소한다'
);

-- 댓글 Trigger는 작성자 보정과 세 콘텐츠의 댓글 수를 처리합니다.
select set_config('request.jwt.claim.sub', '12000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"12000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
-- 앱처럼 id 없이 추가한다. 로그인 사용자는 댓글 id를 지정할 권한이 없으므로 테스트용 id는 관리자 권한으로 붙인다.
set local role authenticated;
insert into public.comments (post_id, content)
values ('22000000-0000-4000-8000-000000000001', '게시글 댓글');
reset role;
update public.comments set id = '62000000-0000-4000-8000-000000000001'
where post_id = '22000000-0000-4000-8000-000000000001' and content = '게시글 댓글';

insert into public.comments (id, recipe_id, writer_uid, writer_name, content) values
  ('62000000-0000-4000-8000-000000000002', '32000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000001', 'Trigger 사용자 A', '레시피 댓글');

insert into public.comments (id, combo_id, writer_uid, writer_name, content) values
  ('62000000-0000-4000-8000-000000000003', '42000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000001', 'Trigger 사용자 A', '조합 댓글');

select extensions.is(
  (select (select comment_count from public.posts where id = '22000000-0000-4000-8000-000000000001')::text || ':' || (select comment_count from public.recipes where id = '32000000-0000-4000-8000-000000000001')::text || ':' || (select comment_count from public.combos where id = '42000000-0000-4000-8000-000000000001')::text),
  '1:1:1',
  '댓글 추가 시 콘텐츠 종류별 카운터가 증가한다'
);

select extensions.is(
  (select writer_uid from public.comments where id = '62000000-0000-4000-8000-000000000001'),
  '12000000-0000-4000-8000-000000000001'::uuid,
  '댓글 작성자를 생략하면 현재 로그인 사용자로 채운다'
);

update public.comments set deleted_at = now() where id in ('62000000-0000-4000-8000-000000000001', '62000000-0000-4000-8000-000000000002', '62000000-0000-4000-8000-000000000003');
select extensions.is(
  (select (select comment_count from public.posts where id = '22000000-0000-4000-8000-000000000001')::text || ':' || (select comment_count from public.recipes where id = '32000000-0000-4000-8000-000000000001')::text || ':' || (select comment_count from public.combos where id = '42000000-0000-4000-8000-000000000001')::text),
  '0:0:0',
  '댓글을 소프트 삭제하면 콘텐츠 종류별 카운터가 감소한다'
);

update public.comments set deleted_at = null where id in ('62000000-0000-4000-8000-000000000001', '62000000-0000-4000-8000-000000000002', '62000000-0000-4000-8000-000000000003');
select extensions.is(
  (select (select comment_count from public.posts where id = '22000000-0000-4000-8000-000000000001')::text || ':' || (select comment_count from public.recipes where id = '32000000-0000-4000-8000-000000000001')::text || ':' || (select comment_count from public.combos where id = '42000000-0000-4000-8000-000000000001')::text),
  '1:1:1',
  '댓글을 복원하면 콘텐츠 종류별 카운터가 증가한다'
);

delete from public.comments where id in ('62000000-0000-4000-8000-000000000001', '62000000-0000-4000-8000-000000000002', '62000000-0000-4000-8000-000000000003');
select extensions.is(
  (select (select comment_count from public.posts where id = '22000000-0000-4000-8000-000000000001')::text || ':' || (select comment_count from public.recipes where id = '32000000-0000-4000-8000-000000000001')::text || ':' || (select comment_count from public.combos where id = '42000000-0000-4000-8000-000000000001')::text),
  '0:0:0',
  '댓글을 물리 삭제해도 콘텐츠 종류별 카운터가 감소한다'
);

-- 조회·좋아요·북마크·댓글로 카운터만 바뀐 UPDATE는 콘텐츠 수정 시각을 바꾸지 않습니다.
select public.increment_post_view('22000000-0000-4000-8000-000000000001');
select public.increment_recipe_view('32000000-0000-4000-8000-000000000001');
select public.increment_combo_view('42000000-0000-4000-8000-000000000001');
insert into public.recipe_likes (user_id, recipe_id) values ('12000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001');
insert into public.comments (id, recipe_id, writer_uid, content)
values ('62000000-0000-4000-8000-000000000009', '32000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000001', '수정 시각 확인 댓글');

select extensions.ok(
  (select bool_and(updated_at = '2000-01-01'::timestamptz) from (
    select updated_at from public.posts where id = '22000000-0000-4000-8000-000000000001'
    union all
    select updated_at from public.recipes where id = '32000000-0000-4000-8000-000000000001'
    union all
    select updated_at from public.combos where id = '42000000-0000-4000-8000-000000000001'
  ) untouched_rows),
  '조회수·좋아요·댓글 수 변경은 콘텐츠 수정 시각을 바꾸지 않는다'
);

select extensions.is(
  (select like_count::text || ':' || comment_count::text from public.recipes where id = '32000000-0000-4000-8000-000000000001'),
  '1:1',
  '수정 시각과 별개로 카운터는 그대로 증가한다'
);

-- 집계값은 컬럼 권한으로 막혀 있어, 수정 요청에 섞으면 요청 전체가 거부됩니다.
set local role authenticated;
select extensions.throws_ok(
  $$update public.posts set title = '수정된 게시글', like_count = 999 where id = '22000000-0000-4000-8000-000000000001'$$,
  '42501', null, '게시글 수정으로 집계값을 직접 바꿀 수 없다'
);
select extensions.throws_ok(
  $$update public.recipes set title = '수정된 레시피', comment_count = 999 where id = '32000000-0000-4000-8000-000000000001'$$,
  '42501', null, '레시피 수정으로 댓글 수를 직접 바꿀 수 없다'
);
select extensions.throws_ok(
  $$update public.combos set title = '수정된 조합', bookmark_count = 999, view_count = 999 where id = '42000000-0000-4000-8000-000000000001'$$,
  '42501', null, '조합 수정으로 집계값을 직접 바꿀 수 없다'
);

update public.posts set title = '수정된 게시글' where id = '22000000-0000-4000-8000-000000000001';
update public.recipes set title = '수정된 레시피' where id = '32000000-0000-4000-8000-000000000001';
update public.combos set title = '수정된 조합' where id = '42000000-0000-4000-8000-000000000001';
reset role;

select extensions.ok(
  (select bool_and(updated_at > '2000-01-01'::timestamptz) from (
    select updated_at from public.posts where id = '22000000-0000-4000-8000-000000000001'
    union all
    select updated_at from public.recipes where id = '32000000-0000-4000-8000-000000000001'
    union all
    select updated_at from public.combos where id = '42000000-0000-4000-8000-000000000001'
  ) updated_rows),
  '콘텐츠 수정 시 updated_at이 갱신된다'
);

select * from extensions.finish();
rollback;
