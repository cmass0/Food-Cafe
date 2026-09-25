begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(8);

-- profiles는 누구나 조회하는 공개 프로필이므로, 테이블 자체가 공개 컬럼만 가져야 한다.
select extensions.is(
  (
    select array_agg(column_name::text order by ordinal_position)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
  ),
  array[
    'id',
    'display_name',
    'photo_url',
    'updated_at',
    'created_at',
    'follower_count',
    'following_count'
  ]::text[],
  '공개 프로필 테이블은 공개 프로필 컬럼만 가진다'
);

select extensions.ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name in ('email', 'phone', 'role')
  ),
  '공개 프로필 테이블에는 이메일·전화번호·역할이 없다'
);

select extensions.ok(
  (
    select table_relation.relrowsecurity
    from pg_class table_relation
    join pg_namespace table_schema on table_schema.oid = table_relation.relnamespace
    where table_schema.nspname = 'public'
      and table_relation.relname = 'profiles'
  ),
  '공개 프로필 테이블에 RLS가 켜져 있다'
);

select extensions.ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_public'
      and cmd = 'SELECT'
      and qual = 'true'
  ),
  '공개 프로필은 누구나 조회할 수 있는 정책을 가진다'
);

select extensions.ok(
  has_table_privilege('anon', 'public.profiles', 'SELECT'),
  '익명 사용자가 공개 프로필을 조회할 수 있다'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.profiles', 'SELECT'),
  '로그인 사용자가 공개 프로필을 조회할 수 있다'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.profiles', 'INSERT')
  and not has_table_privilege('anon', 'public.profiles', 'UPDATE')
  and not has_table_privilege('anon', 'public.profiles', 'DELETE'),
  '익명 사용자는 프로필을 추가·수정·삭제할 수 없다'
);

select extensions.ok(
  to_regclass('public.users_public') is null and to_regclass('public.users') is null,
  '프로필을 그대로 복제하던 호환용 View가 다시 생기지 않는다'
);

select * from extensions.finish();
rollback;
