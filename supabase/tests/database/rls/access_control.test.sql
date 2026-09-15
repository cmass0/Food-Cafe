begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(33);

-- 구조 검증: 앱 테이블과 핵심 정책이 빠지지 않았는지 먼저 확인합니다.
select extensions.is(
  (
    select array_agg(table_relation.relname::text order by table_relation.relname)
    from pg_class table_relation
    join pg_namespace table_schema on table_schema.oid = table_relation.relnamespace
    where table_schema.nspname = 'public'
      and table_relation.relkind = 'r'
      and table_relation.relname = any (array[
        'profiles', 'recipes', 'combos', 'posts', 'comments',
        'recipe_likes', 'recipe_bookmarks', 'post_likes', 'post_bookmarks',
        'combo_likes', 'combo_bookmarks', 'user_follows'
      ])
      and table_relation.relrowsecurity
  ),
  array[
    'combo_bookmarks', 'combo_likes', 'combos', 'comments',
    'post_bookmarks', 'post_likes', 'posts', 'profiles',
    'recipe_bookmarks', 'recipe_likes', 'recipes', 'user_follows'
  ]::text[],
  '모든 앱 데이터 테이블에 RLS가 켜져 있다'
);

select extensions.ok(
  (
    select table_relation.relrowsecurity
    from pg_class table_relation
    join pg_namespace table_schema on table_schema.oid = table_relation.relnamespace
    where table_schema.nspname = 'storage'
      and table_relation.relname = 'objects'
  ),
  'Storage 객체 테이블에 RLS가 켜져 있다'
);

select extensions.is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename in ('recipes', 'combos', 'posts')
      and cmd = 'SELECT'
      and qual = 'true'
  ),
  3,
  '레시피·조합·게시글은 공개 조회 정책을 가진다'
);

select extensions.is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename in ('recipes', 'combos', 'posts')
      and cmd = 'UPDATE'
      and policyname like '%update_own'
  ),
  3,
  '레시피·조합·게시글은 작성자 전용 수정 정책을 가진다'
);

select extensions.is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename in ('recipes', 'combos', 'posts')
      and cmd = 'DELETE'
      and policyname like '%delete_own_or_admin'
  ),
  3,
  '레시피·조합·게시글은 작성자 또는 관리자 삭제 정책을 가진다'
);

-- 역할별 동작 검증용 사용자와 콘텐츠입니다. 파일 전체가 ROLLBACK되므로 남지 않습니다.
insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
    'db-test-author@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"작성자"}', now(), now(), now()
  ),
  (
    '10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
    'db-test-other@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"다른 사용자"}', now(), now(), now()
  ),
  (
    '10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
    'db-test-admin@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"관리자"}', now(), now(), now()
  );

update private.user_roles
set role = 'admin'
where user_id = '10000000-0000-4000-8000-000000000003';

insert into public.posts (id, title, writer_uid, writer_name, category)
values
  ('20000000-0000-4000-8000-000000000001', '게시글 수정 대상', '10000000-0000-4000-8000-000000000001', '작성자', 'free'),
  ('20000000-0000-4000-8000-000000000002', '게시글 삭제 대상', '10000000-0000-4000-8000-000000000001', '작성자', 'free');

insert into public.recipes (id, title, image, steps, ingredients, writer_uid, writer_name)
values
  ('30000000-0000-4000-8000-000000000001', '레시피 수정 대상', 'recipes/test/edit.jpg', '[]', '[]', '10000000-0000-4000-8000-000000000001', '작성자'),
  ('30000000-0000-4000-8000-000000000002', '레시피 삭제 대상', 'recipes/test/delete.jpg', '[]', '[]', '10000000-0000-4000-8000-000000000001', '작성자');

insert into public.combos (id, title, items, writer_uid, writer_name)
values
  ('40000000-0000-4000-8000-000000000001', '조합 수정 대상', '[]', '10000000-0000-4000-8000-000000000001', '작성자'),
  ('40000000-0000-4000-8000-000000000002', '조합 삭제 대상', '[]', '10000000-0000-4000-8000-000000000001', '작성자');

-- 게시글: 작성자 수정·삭제 O, 타인 수정·삭제 X, 관리자 수정 X·삭제 O
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
update public.posts set title = '작성자가 수정함' where id = '20000000-0000-4000-8000-000000000001';
reset role;
select extensions.is((select title from public.posts where id = '20000000-0000-4000-8000-000000000001'), '작성자가 수정함', '게시글 작성자는 자신의 글을 수정할 수 있다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
update public.posts set title = '타인이 수정함' where id = '20000000-0000-4000-8000-000000000001';
reset role;
select extensions.is((select title from public.posts where id = '20000000-0000-4000-8000-000000000001'), '작성자가 수정함', '다른 사용자는 게시글을 수정할 수 없다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
set local role authenticated;
update public.posts set title = '관리자가 수정함' where id = '20000000-0000-4000-8000-000000000001';
reset role;
select extensions.is((select title from public.posts where id = '20000000-0000-4000-8000-000000000001'), '작성자가 수정함', '관리자는 다른 사용자의 게시글을 수정할 수 없다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
delete from public.posts where id = '20000000-0000-4000-8000-000000000002';
reset role;
select extensions.ok(exists (select 1 from public.posts where id = '20000000-0000-4000-8000-000000000002'), '다른 사용자는 게시글을 삭제할 수 없다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;
delete from public.posts where id = '20000000-0000-4000-8000-000000000002';
reset role;
select extensions.ok(not exists (select 1 from public.posts where id = '20000000-0000-4000-8000-000000000002'), '관리자는 다른 사용자의 게시글을 삭제할 수 있다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
delete from public.posts where id = '20000000-0000-4000-8000-000000000001';
reset role;
select extensions.ok(not exists (select 1 from public.posts where id = '20000000-0000-4000-8000-000000000001'), '게시글 작성자는 자신의 글을 삭제할 수 있다');

-- 레시피 권한표
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
update public.recipes set title = '작성자가 수정함' where id = '30000000-0000-4000-8000-000000000001';
reset role;
select extensions.is((select title from public.recipes where id = '30000000-0000-4000-8000-000000000001'), '작성자가 수정함', '레시피 작성자는 자신의 레시피를 수정할 수 있다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
update public.recipes set title = '타인이 수정함' where id = '30000000-0000-4000-8000-000000000001';
reset role;
select extensions.is((select title from public.recipes where id = '30000000-0000-4000-8000-000000000001'), '작성자가 수정함', '다른 사용자는 레시피를 수정할 수 없다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;
update public.recipes set title = '관리자가 수정함' where id = '30000000-0000-4000-8000-000000000001';
reset role;
select extensions.is((select title from public.recipes where id = '30000000-0000-4000-8000-000000000001'), '작성자가 수정함', '관리자는 다른 사용자의 레시피를 수정할 수 없다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
delete from public.recipes where id = '30000000-0000-4000-8000-000000000002';
reset role;
select extensions.ok(exists (select 1 from public.recipes where id = '30000000-0000-4000-8000-000000000002'), '다른 사용자는 레시피를 삭제할 수 없다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;
delete from public.recipes where id = '30000000-0000-4000-8000-000000000002';
reset role;
select extensions.ok(not exists (select 1 from public.recipes where id = '30000000-0000-4000-8000-000000000002'), '관리자는 다른 사용자의 레시피를 삭제할 수 있다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
delete from public.recipes where id = '30000000-0000-4000-8000-000000000001';
reset role;
select extensions.ok(not exists (select 1 from public.recipes where id = '30000000-0000-4000-8000-000000000001'), '레시피 작성자는 자신의 레시피를 삭제할 수 있다');

-- 조합 권한표
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
update public.combos set title = '작성자가 수정함' where id = '40000000-0000-4000-8000-000000000001';
reset role;
select extensions.is((select title from public.combos where id = '40000000-0000-4000-8000-000000000001'), '작성자가 수정함', '조합 작성자는 자신의 조합을 수정할 수 있다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
update public.combos set title = '타인이 수정함' where id = '40000000-0000-4000-8000-000000000001';
reset role;
select extensions.is((select title from public.combos where id = '40000000-0000-4000-8000-000000000001'), '작성자가 수정함', '다른 사용자는 조합을 수정할 수 없다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;
update public.combos set title = '관리자가 수정함' where id = '40000000-0000-4000-8000-000000000001';
reset role;
select extensions.is((select title from public.combos where id = '40000000-0000-4000-8000-000000000001'), '작성자가 수정함', '관리자는 다른 사용자의 조합을 수정할 수 없다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
delete from public.combos where id = '40000000-0000-4000-8000-000000000002';
reset role;
select extensions.ok(exists (select 1 from public.combos where id = '40000000-0000-4000-8000-000000000002'), '다른 사용자는 조합을 삭제할 수 없다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;
delete from public.combos where id = '40000000-0000-4000-8000-000000000002';
reset role;
select extensions.ok(not exists (select 1 from public.combos where id = '40000000-0000-4000-8000-000000000002'), '관리자는 다른 사용자의 조합을 삭제할 수 있다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
delete from public.combos where id = '40000000-0000-4000-8000-000000000001';
reset role;
select extensions.ok(not exists (select 1 from public.combos where id = '40000000-0000-4000-8000-000000000001'), '조합 작성자는 자신의 조합을 삭제할 수 있다');

-- 프로필과 댓글은 허용 컬럼까지 제한합니다.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
update public.profiles set display_name = '수정된 작성자' where id = '10000000-0000-4000-8000-000000000001';
reset role;
select extensions.is((select display_name from public.profiles where id = '10000000-0000-4000-8000-000000000001'), '수정된 작성자', '사용자는 자신의 공개 프로필을 수정할 수 있다');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
update public.profiles set display_name = '타인이 수정함' where id = '10000000-0000-4000-8000-000000000001';
reset role;
select extensions.is((select display_name from public.profiles where id = '10000000-0000-4000-8000-000000000001'), '수정된 작성자', '다른 사용자의 공개 프로필은 수정할 수 없다');

select extensions.is(
  (
    select array_agg(column_name::text order by column_name)
    from information_schema.column_privileges
    where table_schema = 'public'
      and table_name = 'comments'
      and grantee = 'authenticated'
      and privilege_type = 'UPDATE'
  ),
  array['content', 'deleted_at']::text[],
  '댓글은 내용과 소프트 삭제 시각만 변경할 수 있다'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.comments', 'DELETE'),
  '로그인 사용자는 댓글을 물리 삭제할 수 없다'
);

select extensions.ok(
  (
    select bool_and(not has_table_privilege('authenticated', format('public.%I', relation_name), 'INSERT'))
    from unnest(array[
      'recipe_likes', 'recipe_bookmarks', 'post_likes', 'post_bookmarks',
      'combo_likes', 'combo_bookmarks', 'user_follows'
    ]) as relation_name
  ),
  '참여 관계는 일반 사용자가 테이블에 직접 추가할 수 없다'
);

select extensions.ok(
  (
    select bool_and(not has_table_privilege('authenticated', format('public.%I', relation_name), 'DELETE'))
    from unnest(array[
      'recipe_likes', 'recipe_bookmarks', 'post_likes', 'post_bookmarks',
      'combo_likes', 'combo_bookmarks', 'user_follows'
    ]) as relation_name
  ),
  '참여 관계는 일반 사용자가 테이블에서 직접 삭제할 수 없다'
);

select extensions.is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'recipe_likes', 'recipe_bookmarks', 'post_likes',
        'post_bookmarks', 'combo_likes', 'combo_bookmarks'
      )
      and cmd = 'SELECT'
      and qual like '%auth.uid()%'
  ),
  6,
  '좋아요·북마크 목록은 로그인한 본인의 관계만 조회한다'
);

select extensions.ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_follows'
      and policyname = 'user_follows_select_public'
      and cmd = 'SELECT'
      and qual = 'true'
  ),
  '팔로워·팔로잉 목록은 공개 조회 정책을 가진다'
);

select extensions.ok(
  not exists (
    select 1
    from pg_policies policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and concat_ws(' ', policy.qual, policy.with_check) like '%bucket_id%'
      and not exists (
        select 1
        from storage.buckets bucket
        where concat_ws(' ', policy.qual, policy.with_check)
              like '%' || quote_literal(bucket.id) || '%'
      )
  ),
  'Storage 정책이 참조하는 버킷은 실제로 존재한다'
);

select extensions.ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd = 'INSERT'
      and roles @> array['authenticated']::name[]
      and with_check like '%foldername%'
      and with_check like '%auth.uid()%'
  ),
  'Storage 업로드 정책은 로그인 사용자 소유 경로를 검사한다'
);

select * from extensions.finish();
rollback;
