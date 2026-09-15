begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(8);

select extensions.ok(
  to_regclass('public.users_public') is not null,
  '공개 사용자 View가 존재한다'
);

select extensions.is(
  (
    select array_agg(column_name::text order by ordinal_position)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users_public'
  ),
  array[
    'id',
    'display_name',
    'photo_url',
    'created_at',
    'updated_at',
    'follower_count',
    'following_count'
  ]::text[],
  '공개 사용자 View는 공개 프로필 컬럼만 노출한다'
);

select extensions.ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users_public'
      and column_name in ('email', 'phone', 'role')
  ),
  '공개 사용자 View에는 이메일·전화번호·역할이 없다'
);

select extensions.ok(
  exists (
    select 1
    from pg_class view_relation
    join pg_namespace view_schema on view_schema.oid = view_relation.relnamespace
    where view_schema.nspname = 'public'
      and view_relation.relname = 'users_public'
      and coalesce(view_relation.reloptions, '{}'::text[])
          @> array['security_invoker=true']::text[]
  ),
  '공개 사용자 View는 호출자의 RLS 권한을 따른다'
);

select extensions.ok(
  has_table_privilege('anon', 'public.users_public', 'SELECT'),
  '익명 사용자가 공개 사용자 View를 조회할 수 있다'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.users_public', 'SELECT'),
  '로그인 사용자가 공개 사용자 View를 조회할 수 있다'
);

select extensions.ok(
  (
    select table_relation.relrowsecurity
    from pg_class table_relation
    join pg_namespace table_schema on table_schema.oid = table_relation.relnamespace
    where table_schema.nspname = 'public'
      and table_relation.relname = 'profiles'
  ),
  'View의 원본 profiles 테이블에 RLS가 켜져 있다'
);

select extensions.ok(
  position('profiles' in pg_get_viewdef('public.users_public'::regclass, true)) > 0,
  '공개 사용자 View는 profiles를 원본으로 사용한다'
);

select * from extensions.finish();
rollback;
