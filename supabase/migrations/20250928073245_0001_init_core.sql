-- PREVIEW/EXECUTE SCRIPT: Core schema for users, recipes, posts, comments
-- Note: execute in Supabase SQL editor. Uses text PK for recipes to ease Firestore ID migration.

begin;

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
-- Types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'comment_parent_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.comment_parent_type AS ENUM ('recipe','post');
  END IF;
END
$$ LANGUAGE plpgsql;
-- Helper function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;


-- Tables
create table if not exists public.users (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null,
  photo_url    text,
  role         text not null default 'user',
  created_at   timestamptz not null default now()
);

create or replace function public.is_admin(uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.users u where u.id = uid and u.role = 'admin');
$$;

-- Firestore-friendly recipes (text PK, plus legacy uid)
create table if not exists public.recipes (
  id               text primary key,                  
  title            text not null,
  summary          text,
  recipe           text,                                    
  image            text,
  images           text[] not null default '{}',
  category         text,
  tags             text[] not null default '{}',
  like_count       int  not null default 0,
  view_count       int  not null default 0,
  last_liked_at    timestamptz,
  status           smallint default 0,
  writer_uid       uuid references auth.users (id) on delete set null,
  writer_uid_legacy text,
  writer_name      text,
  writer_email     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  tsv tsvector generated always as (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(recipe,''))
  ) stored
);

create trigger trg_recipes_updated
before update on public.recipes
for each row execute function public.set_updated_at();

-- Posts (uuid PK)
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid references public.users(id) on delete set null,
  title         text not null,
  body          text not null,
  tags          text[] not null default '{}',
  like_count    int not null default 0,
  comment_count int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_posts_updated
before update on public.posts
for each row execute function public.set_updated_at();

-- Comments
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  parent_type public.comment_parent_type not null,
  parent_id   uuid not null, -- points to posts.id (uuid) or a synthetic recipe uuid if needed later
  author_id   uuid references public.users(id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- Indexes
create index if not exists idx_comments_parent_created_at on public.comments (parent_type, parent_id, created_at);
create index if not exists idx_recipes_created_at on public.recipes (created_at desc, id);
create index if not exists idx_recipes_tags_gin   on public.recipes using gin (tags);
create index if not exists idx_recipes_tsv_gin    on public.recipes using gin (tsv);
create index if not exists idx_recipes_title_trgm on public.recipes using gin (title gin_trgm_ops);
create index if not exists idx_posts_created_at   on public.posts (created_at desc, id);

-- RLS
alter table public.users    enable row level security;
alter table public.recipes  enable row level security;
alter table public.posts    enable row level security;
alter table public.comments enable row level security;

-- users RLS
drop policy if exists users_select_all on public.users;
create policy users_select_all on public.users for select using (true);
drop policy if exists users_insert_self_or_admin on public.users;
create policy users_insert_self_or_admin on public.users for insert with check (id = auth.uid() or public.is_admin(auth.uid()));
drop policy if exists users_update_self_or_admin on public.users;
create policy users_update_self_or_admin on public.users for update using (id = auth.uid() or public.is_admin(auth.uid())) with check (id = auth.uid() or public.is_admin(auth.uid()));
drop policy if exists users_delete_admin_only on public.users;
create policy users_delete_admin_only on public.users for delete using (public.is_admin(auth.uid()));

-- recipes RLS (allow legacy during migration)
drop policy if exists recipes_select_all on public.recipes;
create policy recipes_select_all on public.recipes for select using (true);
drop policy if exists recipes_insert_own_or_legacy on public.recipes;
create policy recipes_insert_own_or_legacy on public.recipes for insert to authenticated
  with check (writer_uid = auth.uid() or (writer_uid is null and writer_uid_legacy is not null));
drop policy if exists recipes_update_own_or_legacy on public.recipes;
create policy recipes_update_own_or_legacy on public.recipes for update to authenticated
  using (writer_uid = auth.uid() or (writer_uid is null and writer_uid_legacy is not null))
  with check (writer_uid = auth.uid() or (writer_uid is null and writer_uid_legacy is not null));
drop policy if exists recipes_delete_own_or_admin on public.recipes;
create policy recipes_delete_own_or_admin on public.recipes for delete using (writer_uid = auth.uid() or public.is_admin(auth.uid()));

-- posts RLS
drop policy if exists posts_select_all on public.posts;
create policy posts_select_all on public.posts for select using (true);
drop policy if exists posts_insert_own_or_admin on public.posts;
create policy posts_insert_own_or_admin on public.posts for insert to authenticated with check (author_id = auth.uid() or public.is_admin(auth.uid()));
drop policy if exists posts_update_own_or_admin on public.posts;
create policy posts_update_own_or_admin on public.posts for update  to authenticated using (author_id = auth.uid() or public.is_admin(auth.uid())) with check (author_id = auth.uid() or public.is_admin(auth.uid()));
drop policy if exists posts_delete_own_or_admin on public.posts;
create policy posts_delete_own_or_admin on public.posts for delete using (author_id = auth.uid() or public.is_admin(auth.uid()));

-- comments RLS
drop policy if exists comments_select_all on public.comments;
create policy comments_select_all on public.comments for select using (true);
drop policy if exists comments_insert_own_or_admin on public.comments;
create policy comments_insert_own_or_admin on public.comments for insert to authenticated with check (author_id = auth.uid() or public.is_admin(auth.uid()));
drop policy if exists comments_update_own_or_admin on public.comments;
create policy comments_update_own_or_admin on public.comments for update  to authenticated using (author_id = auth.uid() or public.is_admin(auth.uid())) with check (author_id = auth.uid() or public.is_admin(auth.uid()));
drop policy if exists comments_delete_own_or_admin on public.comments;
create policy comments_delete_own_or_admin on public.comments for delete using (author_id = auth.uid() or public.is_admin(auth.uid()));

commit;








;
