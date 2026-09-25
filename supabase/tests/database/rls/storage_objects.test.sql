begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(11);

-- 구조: Food-Cafe 버킷은 업로드·삭제 정책 두 개만 가지며, 파일 크기를 서버에서도 제한한다.
select extensions.is(
  (
    select array_agg(policyname::text order by policyname)
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and concat_ws(' ', qual, with_check) like '%Food-Cafe%'
  ),
  array['food_cafe_images_delete_own', 'food_cafe_images_insert_own']::text[],
  'Food-Cafe 버킷에는 업로드·삭제 정책만 있다'
);

select extensions.is(
  (select file_size_limit from storage.buckets where id = 'Food-Cafe'),
  5242880::bigint,
  'Food-Cafe 버킷은 5MB를 넘는 파일을 받지 않는다'
);

-- 동작: 로그인 사용자는 앱이 쓰는 폴더 중 자기 id 폴더에만 파일을 만들고 지울 수 있다.
insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at
)
values
  (
    '14000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
    'storage-user-a@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"스토리지 사용자 A"}', now(), now(), now()
  ),
  (
    '14000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
    'storage-user-b@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"스토리지 사용자 B"}', now(), now(), now()
  );

-- 다른 사용자의 파일은 관리자 권한으로 미리 만들어 둔다.
insert into storage.objects (bucket_id, name, owner)
values ('Food-Cafe', 'recipes/14000000-0000-4000-8000-000000000002/r1/b.jpg', '14000000-0000-4000-8000-000000000002');

select set_config('request.jwt.claim.sub', '14000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"14000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select extensions.lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('Food-Cafe', 'recipes/14000000-0000-4000-8000-000000000001/r1/a.jpg') $$,
  '자기 id 폴더의 레시피 이미지는 올릴 수 있다'
);

select extensions.lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('Food-Cafe', 'avatars/14000000-0000-4000-8000-000000000001/14000000-0000-4000-8000-000000000001/me.png') $$,
  '자기 프로필 사진은 올릴 수 있다'
);

select extensions.throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('Food-Cafe', 'recipes/14000000-0000-4000-8000-000000000002/r1/x.jpg') $$,
  '42501',
  null,
  '다른 사용자 id 폴더에는 올릴 수 없다'
);

select extensions.throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('Food-Cafe', 'etc/14000000-0000-4000-8000-000000000001/r1/x.jpg') $$,
  '42501',
  null,
  '앱이 쓰지 않는 폴더에는 올릴 수 없다'
);

select extensions.throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('Food-Cafe', 'posts-temp/14000000-0000-4000-8000-000000000001/d1/x.png') $$,
  '42501',
  null,
  '옛 임시 폴더에는 올릴 수 없다'
);

delete from storage.objects where name = 'recipes/14000000-0000-4000-8000-000000000002/r1/b.jpg';
delete from storage.objects where name = 'recipes/14000000-0000-4000-8000-000000000001/r1/a.jpg';

reset role;

select extensions.ok(
  exists (select 1 from storage.objects where name = 'recipes/14000000-0000-4000-8000-000000000002/r1/b.jpg'),
  '다른 사용자의 파일은 지울 수 없다'
);

select extensions.ok(
  not exists (select 1 from storage.objects where name = 'recipes/14000000-0000-4000-8000-000000000001/r1/a.jpg'),
  '자기 파일은 지울 수 있다'
);

set local role anon;

select extensions.throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('Food-Cafe', 'recipes/14000000-0000-4000-8000-000000000001/r1/anon.jpg') $$,
  '42501',
  null,
  '비로그인 사용자는 파일을 올릴 수 없다'
);

reset role;

select extensions.is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd = 'SELECT'
      and concat_ws(' ', qual, with_check) like '%Food-Cafe%'
  ),
  0,
  '공개 버킷은 공개 URL로 읽으므로 파일 목록 조회 정책을 두지 않는다'
);

select * from extensions.finish();
rollback;
