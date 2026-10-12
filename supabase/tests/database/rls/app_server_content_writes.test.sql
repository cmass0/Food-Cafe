begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(21);

-- 규칙: 게시글·레시피·조합의 작성·수정·삭제는 앱 서버를 거친 요청(x-app-server-key 헤더가 Vault 값과 같음)만 받는다.
-- 개발자도구 등으로 Supabase API를 직접 부르면 헤더가 없어 거절된다. 작성·수정은 오류, 삭제는 0행으로 끝난다.
-- 헤더가 맞아도 본인·관리자 확인은 그대로다(rls/access_control.test.sql).
-- PostgREST가 넘기는 request.headers를 set_config로 흉내 낸다. 로컬 테스트 DB에서만 실행하고 끝에서 롤백한다.
--
-- | 요청                      | 작성 | 수정(본인 글) | 삭제(본인 글) |
-- | ------------------------- | ---- | ------------- | ------------- |
-- | 헤더 없음 / 다른 값        | 거절 | 거절          | 0행           |
-- | 맞는 헤더                  | 허용 | 허용          | 허용          |
-- | 맞는 헤더, Vault 값 없음    | 거절 | –             | –             |
-- | 관리자, 헤더 없음(남의 글)  | –    | –             | 0행           |

delete from vault.secrets where name = 'app_server_key';
select vault.create_secret('pgtap-app-server-key', 'app_server_key');

insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('93000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'server-write-author@test.local',
    '{"display_name":"서버 쓰기 작성자"}', now(), now()),
  ('93000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'server-write-admin@test.local',
    '{"display_name":"서버 쓰기 관리자"}', now(), now());

update private.user_roles set role = 'admin' where user_id = '93000000-0000-4000-8000-000000000002';

insert into public.posts (id, title, category, writer_uid)
values
  ('93000000-0000-4000-8000-000000000011', '게시글 원본', 'free', '93000000-0000-4000-8000-000000000001'),
  ('93000000-0000-4000-8000-000000000012', '관리자 삭제 대상', 'free', '93000000-0000-4000-8000-000000000001');
insert into public.recipes (id, title, steps, image, writer_uid)
values ('93000000-0000-4000-8000-000000000021', '레시피 원본', '[]', 'test-image', '93000000-0000-4000-8000-000000000001');
insert into public.combos (id, title, writer_uid)
values ('93000000-0000-4000-8000-000000000031', '조합 원본', '93000000-0000-4000-8000-000000000001');

select extensions.ok(
  not has_function_privilege('anon', 'private.is_app_server()', 'execute'),
  '서버 요청 확인 함수는 쓰기 권한이 없는 anon에게 실행 권한을 주지 않는다'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"93000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

-- 헤더 없음: 브라우저에서 공개 키와 사용자 토큰만으로 직접 부른 요청

select set_config('request.headers', '{"apikey":"public-key"}', true);

select extensions.throws_ok(
  $$
    insert into public.posts (title, category, writer_uid)
    values ('직접 쓴 게시글', 'free', '93000000-0000-4000-8000-000000000001')
  $$,
  '42501',
  'new row violates row-level security policy for table "posts"',
  '헤더 없이 직접 쓴 게시글은 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, image, writer_uid)
    values ('직접 쓴 레시피', '[]', 'test-image', '93000000-0000-4000-8000-000000000001')
  $$,
  '42501',
  'new row violates row-level security policy for table "recipes"',
  '헤더 없이 직접 쓴 레시피는 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.combos (title, writer_uid)
    values ('직접 쓴 조합', '93000000-0000-4000-8000-000000000001')
  $$,
  '42501',
  'new row violates row-level security policy for table "combos"',
  '헤더 없이 직접 쓴 조합은 거절한다'
);

select extensions.throws_ok(
  $$ update public.posts set title = '직접 고침' where id = '93000000-0000-4000-8000-000000000011' $$,
  '42501',
  'new row violates row-level security policy for table "posts"',
  '헤더 없이 자기 게시글을 직접 고치면 거절한다'
);

select extensions.throws_ok(
  $$ update public.recipes set title = '직접 고침' where id = '93000000-0000-4000-8000-000000000021' $$,
  '42501',
  'new row violates row-level security policy for table "recipes"',
  '헤더 없이 자기 레시피를 직접 고치면 거절한다'
);

select extensions.throws_ok(
  $$ update public.combos set title = '직접 고침' where id = '93000000-0000-4000-8000-000000000031' $$,
  '42501',
  'new row violates row-level security policy for table "combos"',
  '헤더 없이 자기 조합을 직접 고치면 거절한다'
);

delete from public.posts where id = '93000000-0000-4000-8000-000000000011';
delete from public.recipes where id = '93000000-0000-4000-8000-000000000021';
delete from public.combos where id = '93000000-0000-4000-8000-000000000031';

select extensions.is(
  (
    select count(*)::integer from (
      select id from public.posts where id = '93000000-0000-4000-8000-000000000011'
      union all select id from public.recipes where id = '93000000-0000-4000-8000-000000000021'
      union all select id from public.combos where id = '93000000-0000-4000-8000-000000000031'
    ) as remaining
  ),
  3,
  '헤더 없이 직접 지우면 0행으로 끝나고 게시글·레시피·조합이 그대로 남는다'
);

select extensions.is(
  (
    select array[p.title, r.title, c.title]
    from public.posts as p, public.recipes as r, public.combos as c
    where p.id = '93000000-0000-4000-8000-000000000011'
      and r.id = '93000000-0000-4000-8000-000000000021'
      and c.id = '93000000-0000-4000-8000-000000000031'
  ),
  array['게시글 원본', '레시피 원본', '조합 원본'],
  '거절된 직접 수정은 저장된 제목을 바꾸지 않는다'
);

-- 다른 값·헤더 정보 없음

select set_config('request.headers', '{"x-app-server-key":"guessed-value"}', true);

select extensions.throws_ok(
  $$
    insert into public.posts (title, category, writer_uid)
    values ('추측한 값', 'free', '93000000-0000-4000-8000-000000000001')
  $$,
  '42501',
  'new row violates row-level security policy for table "posts"',
  '헤더 값이 Vault 값과 다르면 거절한다'
);

select set_config('request.headers', '', true);

select extensions.throws_ok(
  $$
    insert into public.posts (title, category, writer_uid)
    values ('헤더 정보 없음', 'free', '93000000-0000-4000-8000-000000000001')
  $$,
  '42501',
  'new row violates row-level security policy for table "posts"',
  'PostgREST가 아닌 연결처럼 요청 헤더 정보가 없으면 거절한다'
);

-- 맞는 헤더: 앱 서버(getServerSupabase)를 거친 요청

select set_config('request.headers', '{"apikey":"public-key","x-app-server-key":"pgtap-app-server-key"}', true);

select extensions.lives_ok(
  $$
    insert into public.posts (title, category, writer_uid)
    values ('서버가 쓴 게시글', 'free', '93000000-0000-4000-8000-000000000001')
  $$,
  '서버를 거친 게시글 작성은 저장한다'
);

select extensions.lives_ok(
  $$
    insert into public.recipes (title, steps, image, writer_uid)
    values ('서버가 쓴 레시피', '[]', 'test-image', '93000000-0000-4000-8000-000000000001')
  $$,
  '서버를 거친 레시피 작성은 저장한다'
);

select extensions.lives_ok(
  $$
    insert into public.combos (title, writer_uid)
    values ('서버가 쓴 조합', '93000000-0000-4000-8000-000000000001')
  $$,
  '서버를 거친 조합 작성은 저장한다'
);

select extensions.lives_ok(
  $$ update public.posts set title = '서버가 고침' where id = '93000000-0000-4000-8000-000000000011' $$,
  '서버를 거친 자기 게시글 수정은 저장한다'
);

select extensions.lives_ok(
  $$ update public.recipes set title = '서버가 고침' where id = '93000000-0000-4000-8000-000000000021' $$,
  '서버를 거친 자기 레시피 수정은 저장한다'
);

select extensions.lives_ok(
  $$ update public.combos set title = '서버가 고침' where id = '93000000-0000-4000-8000-000000000031' $$,
  '서버를 거친 자기 조합 수정은 저장한다'
);

delete from public.posts where id = '93000000-0000-4000-8000-000000000011';
delete from public.recipes where id = '93000000-0000-4000-8000-000000000021';
delete from public.combos where id = '93000000-0000-4000-8000-000000000031';

select extensions.is(
  (
    select count(*)::integer from (
      select id from public.posts where id = '93000000-0000-4000-8000-000000000011'
      union all select id from public.recipes where id = '93000000-0000-4000-8000-000000000021'
      union all select id from public.combos where id = '93000000-0000-4000-8000-000000000031'
    ) as remaining
  ),
  0,
  '서버를 거친 자기 글 삭제는 게시글·레시피·조합을 지운다'
);

-- 관리자: 남의 글을 지울 수 있지만 서버를 거쳐야 한다

select set_config(
  'request.jwt.claims',
  '{"sub":"93000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
select set_config('request.headers', '{"apikey":"public-key"}', true);
delete from public.posts where id = '93000000-0000-4000-8000-000000000012';

select extensions.ok(
  exists (select 1 from public.posts where id = '93000000-0000-4000-8000-000000000012'),
  '관리자도 헤더 없이 직접 지우면 0행으로 끝난다'
);

select set_config('request.headers', '{"x-app-server-key":"pgtap-app-server-key"}', true);
delete from public.posts where id = '93000000-0000-4000-8000-000000000012';

select extensions.ok(
  not exists (select 1 from public.posts where id = '93000000-0000-4000-8000-000000000012'),
  '관리자는 서버를 거치면 남의 게시글을 지울 수 있다'
);

-- Vault 값이 없으면 헤더가 있어도 모두 거절한다(fail-closed)

reset role;
delete from vault.secrets where name = 'app_server_key';
select set_config(
  'request.jwt.claims',
  '{"sub":"93000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select extensions.throws_ok(
  $$
    insert into public.posts (title, category, writer_uid)
    values ('Vault 값 없음', 'free', '93000000-0000-4000-8000-000000000001')
  $$,
  '42501',
  'new row violates row-level security policy for table "posts"',
  'Vault에 서버 확인값이 없으면 헤더가 있어도 거절한다'
);

reset role;

select * from extensions.finish();

rollback;
