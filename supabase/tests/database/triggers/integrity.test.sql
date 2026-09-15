begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(31);

-- 프로젝트가 의존하는 Trigger의 존재와 활성 상태를 검증합니다.
select extensions.is(
  (
    with expected(schema_name, table_name, trigger_name) as (
      values
        ('auth', 'users', 'on_auth_user_created'),
        ('public', 'combo_bookmarks', 'combo_bookmarks_sync_count'),
        ('public', 'combo_likes', 'combo_likes_sync_count'),
        ('public', 'combos', 'combos_preserve_engagement_counts'),
        ('public', 'combos', 'combos_updated_at'),
        ('public', 'comments', 'tr_comments_set_writer'),
        ('public', 'comments', 'trg_comments_after_delete'),
        ('public', 'comments', 'trg_comments_after_insert'),
        ('public', 'comments', 'trg_comments_after_update'),
        ('public', 'comments', 'trg_comments_updated'),
        ('public', 'post_bookmarks', 'post_bookmarks_sync_count'),
        ('public', 'post_likes', 'post_likes_sync_count'),
        ('public', 'posts', 'posts_preserve_engagement_counts'),
        ('public', 'posts', 'posts_updated_at'),
        ('public', 'profiles', 'profiles_preserve_follow_counts'),
        ('public', 'profiles', 'profiles_set_updated_at'),
        ('public', 'recipe_bookmarks', 'recipe_bookmarks_sync_count'),
        ('public', 'recipe_likes', 'recipe_likes_sync_count'),
        ('public', 'recipes', 'recipes_preserve_engagement_counts'),
        ('public', 'recipes', 'trg_recipes_set_writer'),
        ('public', 'recipes', 'trg_recipes_updated'),
        ('public', 'user_follows', 'user_follows_sync_count')
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
  22,
  '필수 애플리케이션 Trigger 22개가 존재한다'
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
    where function_schema.nspname in ('public', 'private')
      and trigger_function.proname in ('adjust_content_engagement_counter', 'adjust_follow_counters')
      and trigger_function.prosecdef
  ),
  2,
  '참여 카운터 Trigger 함수는 권한 우회가 필요한 SECURITY DEFINER다'
);

select extensions.ok(
  (select prosecdef from pg_proc where oid = 'public.comments_set_writer()'::regprocedure),
  '댓글 작성자 지정 Trigger 함수는 SECURITY DEFINER다'
);

select extensions.ok(
  coalesce((
    select 'search_path=""' = any(trigger_function.proconfig)
    from pg_proc trigger_function
    where trigger_function.oid = 'public.set_updated_at()'::regprocedure
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

insert into public.recipe_bookmarks (user_id, parent_id) values ('12000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001');
select extensions.is((select bookmark_count from public.recipes where id = '32000000-0000-4000-8000-000000000001'), 1, '레시피 북마크 추가 시 카운터가 증가한다');
delete from public.recipe_bookmarks where user_id = '12000000-0000-4000-8000-000000000001' and parent_id = '32000000-0000-4000-8000-000000000001';
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
set local role authenticated;
insert into public.comments (id, parent_type, parent_id, content)
values ('62000000-0000-4000-8000-000000000001', 'post', '22000000-0000-4000-8000-000000000001', '게시글 댓글');
reset role;

insert into public.comments (id, parent_type, parent_id, writer_uid, writer_name, content) values
  ('62000000-0000-4000-8000-000000000002', 'recipe', '32000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000001', 'Trigger 사용자 A', '레시피 댓글'),
  ('62000000-0000-4000-8000-000000000003', 'combo', '42000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000001', 'Trigger 사용자 A', '조합 댓글');

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

-- 일반 사용자가 콘텐츠 수정 요청에 집계값을 섞어도 기존 값이 보존됩니다.
update public.posts set like_count = 7, bookmark_count = 7, view_count = 7 where id = '22000000-0000-4000-8000-000000000001';
update public.recipes set like_count = 7, bookmark_count = 7, view_count = 7 where id = '32000000-0000-4000-8000-000000000001';
update public.combos set like_count = 7, bookmark_count = 7, view_count = 7 where id = '42000000-0000-4000-8000-000000000001';

set local role authenticated;
update public.posts set title = '수정된 게시글', like_count = 999, bookmark_count = 999, view_count = 999 where id = '22000000-0000-4000-8000-000000000001';
update public.recipes set title = '수정된 레시피', like_count = 999, bookmark_count = 999, view_count = 999 where id = '32000000-0000-4000-8000-000000000001';
update public.combos set title = '수정된 조합', like_count = 999, bookmark_count = 999, view_count = 999 where id = '42000000-0000-4000-8000-000000000001';
reset role;

select extensions.is((select like_count::text || ':' || bookmark_count::text || ':' || view_count::text from public.posts where id = '22000000-0000-4000-8000-000000000001'), '7:7:7', '게시글 수정으로 집계값을 직접 바꿀 수 없다');
select extensions.is((select like_count::text || ':' || bookmark_count::text || ':' || view_count::text from public.recipes where id = '32000000-0000-4000-8000-000000000001'), '7:7:7', '레시피 수정으로 집계값을 직접 바꿀 수 없다');
select extensions.is((select like_count::text || ':' || bookmark_count::text || ':' || view_count::text from public.combos where id = '42000000-0000-4000-8000-000000000001'), '7:7:7', '조합 수정으로 집계값을 직접 바꿀 수 없다');

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
