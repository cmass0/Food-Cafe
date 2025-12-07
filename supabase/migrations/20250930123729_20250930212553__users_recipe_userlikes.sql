
begin;


create schema if not exists public;


do $$
begin
  -- rename columns if exist
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='users' and column_name='displayname') then
    alter table public.users rename column displayname to display_name;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='users' and column_name='create_At') then
    alter table public.users rename column create_At to created_at;
  end if;
end $$;

-- missing columns
alter table if exists public.users
  add column if not exists email        text,
  add column if not exists updated_at   timestamptz default now();


do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='users' and column_name='is_admin') then
    alter table public.users
      add column is_admin boolean generated always as (role = 'admin') stored;
  end if;
end $$;


do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='is_admin'
  ) then
    create or replace function public.is_admin(uid uuid)
    returns boolean
    language sql
    security definer
    stable
    as $fn$
      select coalesce(u.is_admin, false)
      from public.users u
      where u.id = uid
    $fn$;
    comment on function public.is_admin(uuid) is 'Return true if users.is_admin for the given uid';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='recipes' and constraint_name='recipes_writer_fk'
  ) then
    alter table public.recipes
      add constraint recipes_writer_fk
      foreign key (writer_uid) references public.users(id)
      on delete set null;
  end if;
end $$;

create or replace function public.set_writer_uid()
returns trigger language plpgsql as $$
begin
  if new.writer_uid is null then
    new.writer_uid := auth.uid();
  end if;
  return new;
end; $$;

drop trigger if exists trg_recipes_set_writer on public.recipes;
create trigger trg_recipes_set_writer
before insert on public.recipes
for each row execute function public.set_writer_uid();


alter table public.recipes
  drop constraint if exists recipes_image_required;

alter table public.recipes
  add constraint recipes_image_required
  check (coalesce(nullif(trim(image), ''), null) is not null);


create table if not exists public.user_likes (
  user_id   uuid not null references public.users(id)   on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, recipe_id)
);

create index if not exists idx_user_likes_user   on public.user_likes(user_id);
create index if not exists idx_user_likes_recipe on public.user_likes(recipe_id);

-- RLS
alter table public.user_likes enable row level security;

drop policy if exists user_likes_select_all on public.user_likes;
create policy user_likes_select_all
on public.user_likes for select
to public
using (true);

drop policy if exists user_likes_insert_self on public.user_likes;
create policy user_likes_insert_self
on public.user_likes for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists user_likes_delete_self on public.user_likes;
create policy user_likes_delete_self
on public.user_likes for delete
to authenticated
using (user_id = auth.uid());

alter table public.users enable row level security;

drop policy if exists users_select_all on public.users;
create policy users_select_all
on public.users for select
to public
using (true);

drop policy if exists users_insert_self_or_admin on public.users;
create policy users_insert_self_or_admin
on public.users for insert
to authenticated
with check (id = auth.uid() or is_admin(auth.uid()));

drop policy if exists users_update_self_or_admin on public.users;
create policy users_update_self_or_admin
on public.users for update
to authenticated
using (id = auth.uid() or is_admin(auth.uid()))
with check (id = auth.uid() or is_admin(auth.uid()));

drop policy if exists users_delete_admin_only on public.users;
create policy users_delete_admin_only
on public.users for delete
to authenticated
using (is_admin(auth.uid()));

commit;


;
