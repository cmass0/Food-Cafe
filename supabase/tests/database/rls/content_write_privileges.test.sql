begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(11);

-- 앱 서버를 거친 요청처럼 서버 확인 헤더를 붙인다. 헤더 없는 직접 요청 차단은 rls/app_server_content_writes.test.sql이 확인한다.
delete from vault.secrets where name = 'app_server_key';
select vault.create_secret('pgtap-app-server-key', 'app_server_key');
select set_config('request.headers', '{"x-app-server-key":"pgtap-app-server-key"}', true);

-- 규칙: public 테이블의 사용자 쓰기는 테이블 전체가 아니라 허용한 컬럼 단위로만 연다.
-- 새 테이블이 Supabase 기본값처럼 전체 쓰기 권한을 가지면 이 테스트가 실패한다.
select extensions.is(
  (
    select coalesce(array_agg(format('%s:%s:%s', app_role, relation.relname, privilege) order by 1), '{}')
    from pg_class relation
    join pg_namespace relation_schema on relation_schema.oid = relation.relnamespace
    cross join unnest(array['anon', 'authenticated']) as app_role
    cross join unnest(array['INSERT', 'UPDATE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) as privilege
    where relation_schema.nspname = 'public'
      and relation.relkind = 'r'
      and has_table_privilege(app_role, relation.oid, privilege)
  ),
  '{}'::text[],
  '앱 역할은 어떤 public 테이블에도 테이블 전체 INSERT·UPDATE·TRUNCATE 권한을 갖지 않는다'
);

select extensions.is(
  (
    select coalesce(array_agg(relation.relname::text order by relation.relname), '{}')
    from pg_class relation
    join pg_namespace relation_schema on relation_schema.oid = relation.relnamespace
    where relation_schema.nspname = 'public'
      and relation.relkind = 'r'
      and has_table_privilege('anon', relation.oid, 'DELETE')
  ),
  '{}'::text[],
  '익명 사용자는 어떤 public 테이블도 삭제할 수 없다'
);

-- 규칙: 시스템이 관리하는 컬럼은 어느 테이블에서도 사용자가 직접 쓸 수 없다.
select extensions.is(
  (
    select coalesce(array_agg(format('%s.%s:%s', column_info.table_name, column_info.column_name, privilege) order by 1), '{}')
    from information_schema.columns as column_info
    -- security_invoker View는 기반 테이블 권한으로 다시 검사되므로 실제 테이블만 확인한다.
    join information_schema.tables as table_info
      on table_info.table_schema = column_info.table_schema
      and table_info.table_name = column_info.table_name
      and table_info.table_type = 'BASE TABLE'
    cross join unnest(array['INSERT', 'UPDATE']) as privilege
    where column_info.table_schema = 'public'
      and column_info.column_name in (
        'like_count', 'bookmark_count', 'view_count', 'comment_count',
        'follower_count', 'following_count', 'last_liked_at',
        'created_at', 'updated_at', 'deleted_at', 'tsv', 'number'
      )
      and (column_info.table_name <> 'comments' or column_info.column_name <> 'deleted_at' or privilege <> 'UPDATE')
      and has_column_privilege(
        'authenticated',
        format('public.%I', column_info.table_name),
        column_info.column_name,
        privilege
      )
  ),
  '{}'::text[],
  '카운터·시각·검색 컬럼은 로그인 사용자가 직접 추가하거나 수정할 수 없다'
);

select extensions.is(
  (
    select coalesce(array_agg(format('%s.%s', column_info.table_name, column_info.column_name) order by 1), '{}')
    from information_schema.columns as column_info
    where column_info.table_schema = 'public'
      and column_info.column_name in ('id', 'writer_uid', 'writer_name', 'post_id', 'recipe_id', 'combo_id')
      and column_info.table_name in ('recipes', 'posts', 'combos', 'comments')
      and has_column_privilege(
        'authenticated',
        format('public.%I', column_info.table_name),
        column_info.column_name,
        'UPDATE'
      )
  ),
  '{}'::text[],
  '작성된 콘텐츠의 ID·작성자·부모는 로그인 사용자가 바꿀 수 없다'
);

-- 규칙: 사용자가 수정할 수 있는 컬럼과 수정 시각(updated_at)을 갱신하는 컬럼은 같다.
-- 새 입력 컬럼을 UPDATE 권한에만 추가하고 trg_<테이블>_set_updated_at에 빠뜨리면 실패한다.
select extensions.is(
  (
    with editable as (
      select privilege.table_name::text, array_agg(privilege.column_name::text order by privilege.column_name) as columns
      from information_schema.column_privileges as privilege
      join information_schema.tables as table_info
        on table_info.table_schema = privilege.table_schema
        and table_info.table_name = privilege.table_name
        and table_info.table_type = 'BASE TABLE'
      where privilege.table_schema = 'public'
        and privilege.grantee = 'authenticated'
        and privilege.privilege_type = 'UPDATE'
      group by privilege.table_name
    ),
    watched as (
      select relation.relname::text as table_name, array_agg(attribute.attname::text order by attribute.attname) as columns
      from pg_trigger as app_trigger
      join pg_class as relation on relation.oid = app_trigger.tgrelid
      join pg_namespace as relation_schema on relation_schema.oid = relation.relnamespace
      join pg_attribute as attribute
        on attribute.attrelid = app_trigger.tgrelid
        and attribute.attnum = any(app_trigger.tgattr::int2[])
      where relation_schema.nspname = 'public'
        and app_trigger.tgname = format('trg_%s_set_updated_at', relation.relname)
      group by relation.relname
    )
    select coalesce(array_agg(coalesce(editable.table_name, watched.table_name) order by 1), '{}')
    from editable
    full join watched on watched.table_name = editable.table_name
    where editable.columns is distinct from watched.columns
  ),
  '{}'::text[],
  '사용자가 수정할 수 있는 컬럼과 수정 시각을 갱신하는 컬럼이 테이블마다 같다'
);

-- 동작: 작성자는 허용 컬럼만 수정할 수 있고, 카운터를 섞은 요청은 전체가 거부된다.
insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at
)
values (
  '14000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
  'write-privilege@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
  '{"display_name":"권한 사용자"}', now(), now(), now()
);

insert into public.recipes (id, title, image, steps, ingredients, writer_uid, writer_name)
values ('34000000-0000-4000-8000-000000000001', '권한 레시피', 'recipes/test/write.jpg', '[]', '[]', '14000000-0000-4000-8000-000000000001', '권한 사용자');

select set_config('request.jwt.claim.sub', '14000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"14000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

update public.recipes set title = '수정된 권한 레시피' where id = '34000000-0000-4000-8000-000000000001';

select extensions.throws_ok(
  $$update public.recipes set title = '카운터 조작', like_count = 9999 where id = '34000000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  '작성자도 수정 요청에 좋아요 수를 섞을 수 없다'
);

select extensions.throws_ok(
  $$insert into public.recipes (title, image, steps, ingredients, writer_uid, comment_count)
    values ('카운터 포함 생성', 'recipes/test/write.jpg', '[]', '[]', '14000000-0000-4000-8000-000000000001', 9999)$$,
  '42501',
  null,
  '새 레시피를 만들면서 댓글 수를 지정할 수 없다'
);

select extensions.throws_ok(
  $$insert into public.recipes (title, image, steps, ingredients, writer_uid, writer_name)
    values ('이름 위조', 'recipes/test/write.jpg', '[]', '[]', '14000000-0000-4000-8000-000000000001', '운영자')$$,
  '42501',
  null,
  '작성자 이름은 사용자가 직접 지정할 수 없다'
);

select extensions.lives_ok(
  $$insert into public.recipes (id, title, image, steps, ingredients)
    values ('34000000-0000-4000-8000-000000000002', '허용 컬럼 생성', 'recipes/test/write.jpg', '[]', '[]')$$,
  '허용 컬럼만 보내면 레시피를 생성할 수 있다'
);
reset role;

select extensions.is(
  (select title || ':' || like_count::text from public.recipes where id = '34000000-0000-4000-8000-000000000001'),
  '수정된 권한 레시피:0',
  '허용 컬럼 수정은 반영되고 거부된 요청은 아무 값도 바꾸지 않는다'
);

select extensions.is(
  (select writer_uid::text || ':' || writer_name from public.recipes where id = '34000000-0000-4000-8000-000000000002'),
  '14000000-0000-4000-8000-000000000001:권한 사용자',
  '새 레시피의 작성자 id와 이름은 로그인 사용자와 그 프로필 이름으로 채워진다'
);

select * from extensions.finish();
rollback;
