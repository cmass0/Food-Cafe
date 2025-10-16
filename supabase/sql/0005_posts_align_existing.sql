-- 0005_posts_align_existing.sql
-- Align existing posts table with Supabase domain expectations.

begin;

alter table public.posts
  rename column author_id to writer_uid;

alter table public.posts
  alter column writer_uid type uuid using writer_uid::uuid;

alter table public.posts
  rename column body to content;

alter table public.posts
  drop constraint if exists posts_author_id_fkey;

alter table public.posts
  add constraint posts_writer_uid_fkey
  foreign key (writer_uid) references auth.users(id) on delete set null;

alter table public.posts
  add column if not exists writer_name text;

update public.posts
  set writer_name = coalesce(writer_name, '')
  where writer_name is null;

alter table public.posts
  alter column writer_name set default '';

alter table public.posts
  alter column writer_name set not null;

alter table public.posts
  add column if not exists type text;

update public.posts
  set type = coalesce(type, 'board')
  where type is null;

alter table public.posts
  alter column type set default 'board';

alter table public.posts
  alter column type set not null;

alter table public.posts
  add column if not exists view_count integer;

update public.posts
  set view_count = coalesce(view_count, 0)
  where view_count is null;

alter table public.posts
  alter column view_count set default 0;

alter table public.posts
  alter column view_count set not null;

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

select setval('posts_number_seq', (select coalesce(max(number), 0) from public.posts));

alter table public.posts
  alter column number set default nextval('posts_number_seq');

alter table public.posts
  alter column number set not null;

drop index if exists idx_posts_created_at;
create index if not exists idx_posts_created_at on public.posts (created_at desc, id desc);

drop index if exists idx_posts_writer_uid;
create index if not exists idx_posts_writer_uid on public.posts (writer_uid);

drop index if exists idx_posts_type;
create index if not exists idx_posts_type on public.posts (type);

drop trigger if exists posts_updated_at on public.posts;
drop function if exists public.handle_posts_updated_at();

create or replace function public.handle_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_updated_at
before update on public.posts
for each row execute procedure public.handle_posts_updated_at();

drop function if exists public.increment_post_view_count(uuid);

create or replace function public.increment_post_view_count(target uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts
     set view_count = view_count + 1,
         updated_at = now()
   where id = target;
$$;

grant execute on function public.increment_post_view_count(uuid) to authenticated;

create or replace function public.is_admin(claims jsonb)
returns boolean
language sql
as $$
  select coalesce(claims->>'role' in ('service_role', 'admin'), false);
$$;

alter table public.posts enable row level security;

drop policy if exists "posts_select_all" on public.posts;
drop policy if exists "posts_insert_own_or_admin" on public.posts;
drop policy if exists "posts_update_own_or_admin" on public.posts;
drop policy if exists "posts_delete_own_or_admin" on public.posts;

create policy "posts_select_all" on public.posts
  for select using (true);

create policy "posts_insert_own_or_admin" on public.posts
  for insert to authenticated
  with check (
    auth.uid() = writer_uid
    or public.is_admin(current_setting('request.jwt.claims', true)::jsonb)
  );

create policy "posts_update_own_or_admin" on public.posts
  for update to authenticated
  using (
    auth.uid() = writer_uid
    or public.is_admin(current_setting('request.jwt.claims', true)::jsonb)
  );

create policy "posts_delete_own_or_admin" on public.posts
  for delete to authenticated
  using (
    auth.uid() = writer_uid
    or public.is_admin(current_setting('request.jwt.claims', true)::jsonb)
  );

commit;
