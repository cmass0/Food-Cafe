-- 0005_posts_align_with_existing.sql
-- Align existing posts table with new domain requirements (hardened)

begin;

-- 0) 기존 RLS 정책 충돌 방지(타입 변경 전에 의존성 제거)
drop policy if exists "posts_select_all" on public.posts;
drop policy if exists "posts_insert_own_or_admin" on public.posts;
drop policy if exists "posts_update_own_or_admin" on public.posts;
drop policy if exists "posts_delete_own_or_admin" on public.posts;

-- 1) 컬럼 이름/타입 정리 (기존 스키마에서 실행)
-- 주의: author_id 값이 uuid 형식이 아닐 경우 alter 실패. 사전 정리 필요.
alter table public.posts
  rename column author_id to writer_uid;

alter table public.posts
  alter column writer_uid type uuid using writer_uid::uuid;

alter table public.posts
  rename column body to content;

-- 2) FK 재설정
alter table public.posts
  drop constraint if exists posts_author_id_fkey;

alter table public.posts
  add constraint posts_writer_uid_fkey
  foreign key (writer_uid) references auth.users(id) on delete set null;

-- 3) 신규/보조 컬럼 추가 + 기본값
alter table public.posts
  add column if not exists writer_name text;

update public.posts
  set writer_name = coalesce(writer_name, '')
where writer_name is null;

alter table public.posts
  alter column writer_name set default '',
  alter column writer_name set not null;

alter table public.posts
  add column if not exists type text;

update public.posts
  set type = coalesce(type, 'board')
where type is null;

alter table public.posts
  alter column type set default 'board',
  alter column type set not null;

alter table public.posts
  add column if not exists view_count integer;

update public.posts
  set view_count = coalesce(view_count, 0)
where view_count is null;

alter table public.posts
  alter column view_count set default 0,
  alter column view_count set not null;

-- number: 기존 데이터에 연속 번호 백필 후 시퀀스 연결
alter table public.posts
  add column if not exists number bigint;

with ordered as (
  select id,
         row_number() over (order by created_at nulls last, id) as rn
  from public.posts
)
update public.posts p
set number = o.rn
from ordered o
where p.id = o.id
  and (p.number is null);

create sequence if not exists posts_number_seq owned by public.posts.number;

select setval(
  'posts_number_seq',
  greatest((select coalesce(max(number), 0) from public.posts), 1)
);

alter table public.posts
  alter column number set default nextval('posts_number_seq'),
  alter column number set not null;

-- 4) 인덱스
drop index if exists idx_posts_created_at;
create index if not exists idx_posts_created_at
  on public.posts (created_at desc, id desc);

drop index if exists idx_posts_writer_uid;
create index if not exists idx_posts_writer_uid
  on public.posts (writer_uid);

drop index if exists idx_posts_type;
create index if not exists idx_posts_type
  on public.posts (type);

-- 5) updated_at 트리거 (view_count 변경만 있을 때는 updated_at 갱신 제외)
drop trigger if exists posts_updated_at on public.posts;
drop function if exists public.handle_posts_updated_at();

create or replace function public.handle_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  -- updated_at, view_count를 제외하고 값 변화가 있을 때만 수정 시간 갱신
  if (to_jsonb(new) - 'updated_at' - 'view_count')
       is distinct from
     (to_jsonb(old) - 'updated_at' - 'view_count') then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

create trigger posts_updated_at
before update on public.posts
for each row execute procedure public.handle_posts_updated_at();

-- 6) 조회수 증가 RPC (updated_at 비변경) + 권한 기본 회수
drop function if exists public.increment_post_view_count(uuid);

create or replace function public.increment_post_view_count(target uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts
     set view_count = view_count + 1
   where id = target;
$$;

-- 기본적으로 직접 호출을 막고(회수), 서버에서만 호출하도록 운영 권장
revoke all on function public.increment_post_view_count(uuid) from public;
revoke all on function public.increment_post_view_count(uuid) from authenticated;
-- 필요 시 서버에서만 호출: service role 키로 실행
-- (클라이언트에서 직접 호출하게 하려면 아래 grant를 해제하고 레이트리밋을 별도로 구현)
-- grant execute on function public.increment_post_view_count(uuid) to authenticated;

-- 7) RLS (owner + admin(DB 컬럼 기반))
-- 관리자 판별: public.users.is_admin = true
alter table public.posts enable row level security;

drop policy if exists "posts_select_all" on public.posts;
drop policy if exists "posts_insert_own_or_admin" on public.posts;
drop policy if exists "posts_update_own_or_admin" on public.posts;
drop policy if exists "posts_delete_own_or_admin" on public.posts;

create policy "posts_select_all" on public.posts
  for select
  using (true);

create policy "posts_insert_own_or_admin" on public.posts
  for insert to authenticated
  with check (
    auth.uid() = writer_uid
    or exists (
      select 1
      from public.users u
      where u.id = auth.uid() and coalesce(u.is_admin, false) = true
    )
  );

create policy "posts_update_own_or_admin" on public.posts
  for update to authenticated
  using (
    auth.uid() = writer_uid
    or exists (
      select 1
      from public.users u
      where u.id = auth.uid() and coalesce(u.is_admin, false) = true
    )
  )
  with check (
    auth.uid() = writer_uid
    or exists (
      select 1
      from public.users u
      where u.id = auth.uid() and coalesce(u.is_admin, false) = true
    )
  );

create policy "posts_delete_own_or_admin" on public.posts
  for delete to authenticated
  using (
    auth.uid() = writer_uid
    or exists (
      select 1
      from public.users u
      where u.id = auth.uid() and coalesce(u.is_admin, false) = true
    )
  );

commit;
