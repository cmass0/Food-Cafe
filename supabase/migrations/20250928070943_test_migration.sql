-- Food Cafe current remote schema baseline
-- Generated from the connected Supabase project without copying user data.
-- Future schema changes must be added as new timestamped migrations.

begin;

set search_path = public, extensions;

create schema if not exists private;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pg_trgm with schema public;

-- Custom enum types
create type public.comment_parent_type as enum ('recipe', 'post', 'combo');

-- Sequences
create sequence public.posts_number_seq as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 start with 1 cache 1 no cycle;

-- Functions required by column defaults
CREATE OR REPLACE FUNCTION public.uuid_v7()
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  time_hex text := lpad(to_hex(ms), 12, '0');
  r1 text := encode(gen_random_bytes(8), 'hex');
  r2 text := encode(gen_random_bytes(8), 'hex');
  b1 text := substr(time_hex, 1, 8);
  b2 text := substr(time_hex, 9, 4);
  rand_a3 text := substr(r1, 1, 3);
  variant_nibbles text[] := array['8','9','a','b'];
  v_hi text := variant_nibbles[(get_byte(gen_random_bytes(1),0) & 3)+1];
  b4_tail text := substr(r2, 1, 3);
  b5 text := substr(r2, 4, 12);
  uuid_txt text;
begin
  uuid_txt := format('%s-%s-%s-%s-%s', b1, b2, '7'||rand_a3, v_hi||b4_tail, b5);
  return uuid_txt::uuid;
end;
$function$;

-- Application tables
create table private.user_roles (
  user_id uuid not null,
  role text default 'user'::text not null
);

create table public.combo_bookmarks (
  user_id uuid not null,
  combo_id uuid not null,
  created_at timestamp with time zone default now() not null
);

create table public.combo_likes (
  user_id uuid not null,
  combo_id uuid not null,
  created_at timestamp with time zone default now() not null
);

create table public.combo_recipe_ref (
  combo_id uuid not null,
  recipe_id uuid not null,
  note text,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

create table public.combos (
  id uuid default gen_random_uuid() not null,
  title text not null,
  summary text,
  steps jsonb,
  items jsonb default '[]'::jsonb not null,
  tags text[] default '{}'::text[] not null,
  difficulty text,
  time_minutes integer,
  tools_required boolean default false not null,
  image text,
  like_count integer default 0 not null,
  view_count integer default 0 not null,
  comment_count integer default 0 not null,
  writer_uid uuid,
  writer_name text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  bookmark_count integer default 0 not null,
  tools text[],
  tsv tsvector generated always as (to_tsvector('simple'::regconfig, ((COALESCE(title, ''::text) || ' '::text) || COALESCE(summary, ''::text)))) stored
);

create table public.comments (
  id uuid default gen_random_uuid() not null,
  parent_type comment_parent_type not null,
  parent_id uuid not null,
  writer_uid uuid,
  content text not null,
  created_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone,
  writer_name text default ''::text not null,
  updated_at timestamp with time zone default now() not null
);

create table public.post_bookmarks (
  user_id uuid not null,
  post_id uuid not null,
  created_at timestamp with time zone default now() not null
);

create table public.post_likes (
  user_id uuid not null,
  post_id uuid not null,
  created_at timestamp with time zone default now() not null
);

create table public.posts (
  id uuid default gen_random_uuid() not null,
  writer_uid uuid not null,
  title text not null,
  tags text[] default '{}'::text[] not null,
  like_count integer default 0 not null,
  comment_count integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  writer_name text default ''::text not null,
  view_count integer default 0 not null,
  number bigint default nextval('posts_number_seq'::regclass) not null,
  content_json jsonb,
  content_text text,
  tsv tsvector generated always as (to_tsvector('simple'::regconfig, ((COALESCE(title, ''::text) || ' '::text) || "left"(COALESCE(content_text, ''::text), 200000)))) stored,
  content_html text,
  category text default 'free'::text not null,
  bookmark_count integer default 0 not null
);

create table public.profiles (
  id uuid not null,
  display_name text not null,
  photo_url text,
  updated_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null,
  follower_count integer default 0 not null,
  following_count integer default 0 not null
);

create table public.recipe_bookmarks (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  parent_id uuid not null,
  created_at timestamp with time zone default now() not null
);

create table public.recipe_likes (
  user_id uuid not null,
  recipe_id uuid not null,
  created_at timestamp with time zone default now()
);

create table public.recipes (
  title text not null,
  summary text,
  steps jsonb not null,
  image text,
  category text,
  tags text[] default '{}'::text[] not null,
  like_count integer default 0 not null,
  view_count integer default 0 not null,
  last_liked_at timestamp with time zone,
  writer_uid uuid,
  writer_name text,
  writer_email text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  id uuid default uuid_v7() not null,
  ingredients jsonb default '[]'::jsonb not null,
  difficulty text,
  time_minutes integer,
  servings integer,
  tsv tsvector generated always as (to_tsvector('simple'::regconfig, ((((COALESCE(title, ''::text) || ' '::text) || COALESCE(summary, ''::text)) || ' '::text) || COALESCE(jsonb_to_tsvector('simple'::regconfig, jsonb_path_query_array(COALESCE(ingredients, '[]'::jsonb), '$[*]."name"'::jsonpath), '["string"]'::jsonb))))) stored,
  bookmark_count integer default 0 not null,
  tools text[],
  tools_required boolean default false not null,
  comment_count integer default 0 not null,
  chef_tip text,
  images text[] default '{}'::text[] not null
);

create table public.user_follows (
  follower_id uuid not null,
  following_id uuid not null,
  created_at timestamp with time zone default now() not null
);

-- Table constraints
alter table only private.user_roles add constraint user_roles_pkey PRIMARY KEY (user_id);

alter table only public.combo_bookmarks add constraint combo_bookmarks_pkey PRIMARY KEY (user_id, combo_id);

alter table only public.combo_likes add constraint combo_likes_pkey PRIMARY KEY (user_id, combo_id);

alter table only public.combo_recipe_ref add constraint combo_recipe_ref_pkey PRIMARY KEY (combo_id, recipe_id);

alter table only public.combos add constraint combos_pkey PRIMARY KEY (id);

alter table only public.comments add constraint comments_pkey PRIMARY KEY (id);

alter table only public.post_bookmarks add constraint post_bookmarks_pkey PRIMARY KEY (user_id, post_id);

alter table only public.post_likes add constraint post_likes_pkey PRIMARY KEY (user_id, post_id);

alter table only public.posts add constraint posts_pkey PRIMARY KEY (id);

alter table only public.profiles add constraint profiles_pkey PRIMARY KEY (id);

alter table only public.recipe_bookmarks add constraint user_bookmarks_pkey PRIMARY KEY (id);

alter table only public.recipe_likes add constraint user_likes_pkey PRIMARY KEY (user_id, recipe_id);

alter table only public.recipes add constraint recipes_pkey PRIMARY KEY (id);

alter table only public.user_follows add constraint user_follows_pkey PRIMARY KEY (follower_id, following_id);

alter table only public.recipe_bookmarks add constraint user_bookmarks_user_id_parent_id_key UNIQUE (user_id, parent_id);

alter table only public.recipe_likes add constraint user_likes_user_recipe_unique UNIQUE (user_id, recipe_id);

alter table only private.user_roles add constraint user_roles_role_check CHECK (role = ANY (ARRAY['user'::text, 'admin'::text]));

alter table only public.combos add constraint combos_engagement_counts_nonnegative CHECK (like_count >= 0 AND bookmark_count >= 0 AND view_count >= 0 AND comment_count >= 0);

alter table only public.posts add constraint posts_category_allowed CHECK (category = ANY (ARRAY['free'::text, 'recipe_tip'::text, 'question'::text, 'review'::text]));

alter table only public.posts add constraint posts_engagement_counts_nonnegative CHECK (like_count >= 0 AND bookmark_count >= 0 AND view_count >= 0 AND comment_count >= 0);

alter table only public.profiles add constraint profiles_display_name_check CHECK (length(btrim(display_name)) >= 1 AND length(btrim(display_name)) <= 40);

alter table only public.profiles add constraint profiles_follow_counts_nonnegative CHECK (follower_count >= 0 AND following_count >= 0);

alter table only public.recipes add constraint recipes_engagement_counts_nonnegative CHECK (like_count >= 0 AND bookmark_count >= 0 AND view_count >= 0 AND comment_count >= 0);

alter table only public.recipes add constraint recipes_image_required CHECK (image IS NOT NULL);

alter table only public.user_follows add constraint user_follows_check CHECK (follower_id <> following_id);

alter table only private.user_roles add constraint user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.combo_bookmarks add constraint combo_bookmarks_combo_id_fkey FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE;

alter table only public.combo_bookmarks add constraint combo_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.combo_likes add constraint combo_likes_combo_id_fkey FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE;

alter table only public.combo_likes add constraint combo_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.combo_recipe_ref add constraint combo_recipe_ref_combo_id_fkey FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE;

alter table only public.combo_recipe_ref add constraint combo_recipe_ref_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE RESTRICT;

alter table only public.combos add constraint combos_writer_uid_fkey FOREIGN KEY (writer_uid) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.comments add constraint comments_writer_uid_fkey FOREIGN KEY (writer_uid) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.post_bookmarks add constraint post_bookmarks_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

alter table only public.post_bookmarks add constraint post_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table only public.post_likes add constraint post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

alter table only public.post_likes add constraint post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table only public.posts add constraint posts_writer_uid_fkey FOREIGN KEY (writer_uid) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.profiles add constraint profiles_auth_user_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.recipe_bookmarks add constraint user_bookmarks_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES recipes(id) ON DELETE CASCADE;

alter table only public.recipe_bookmarks add constraint user_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.recipe_likes add constraint user_likes_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE;

alter table only public.recipe_likes add constraint user_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table only public.recipes add constraint recipes_writer_fk FOREIGN KEY (writer_uid) REFERENCES profiles(id) ON DELETE SET NULL;

alter table only public.recipes add constraint recipes_writer_uid_fkey FOREIGN KEY (writer_uid) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.user_follows add constraint user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table only public.user_follows add constraint user_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Sequence ownership
alter sequence public.posts_number_seq owned by public.posts.number;

-- Indexes
CREATE INDEX idx_combo_bookmarks_combo ON combo_bookmarks USING btree (combo_id, created_at DESC);

CREATE INDEX idx_combo_bookmarks_recent_trending ON combo_bookmarks USING btree (created_at DESC, combo_id, user_id);

CREATE INDEX idx_combo_likes_combo ON combo_likes USING btree (combo_id, created_at DESC);

CREATE INDEX idx_combo_likes_recent_trending ON combo_likes USING btree (created_at DESC, combo_id, user_id);

CREATE INDEX idx_combo_recipe_refs_combo_sort ON combo_recipe_ref USING btree (combo_id, sort_order);

CREATE INDEX idx_combo_recipe_refs_recipe ON combo_recipe_ref USING btree (recipe_id);

CREATE INDEX combos_tsv_gin ON combos USING gin (tsv);

CREATE INDEX idx_combos_created_at ON combos USING btree (created_at DESC, id);

CREATE INDEX idx_combos_tags_gin ON combos USING gin (tags);

CREATE INDEX idx_comments_author_id ON comments USING btree (writer_uid);

CREATE INDEX idx_comments_parent_created_at ON comments USING btree (parent_type, parent_id, created_at);

CREATE INDEX idx_comments_recent_trending ON comments USING btree (parent_type, created_at DESC, parent_id, writer_uid) WHERE deleted_at IS NULL;

CREATE INDEX idx_comments_writer_created_at ON comments USING btree (writer_uid, created_at DESC);

CREATE INDEX idx_post_bookmarks_recent_trending ON post_bookmarks USING btree (created_at DESC, post_id, user_id);

CREATE INDEX idx_post_likes_recent_trending ON post_likes USING btree (created_at DESC, post_id, user_id);

CREATE INDEX idx_posts_created_at ON posts USING btree (created_at DESC, id DESC);

CREATE INDEX idx_posts_writer_uid ON posts USING btree (writer_uid);

CREATE INDEX posts_category_created_at_id_idx ON posts USING btree (category, created_at DESC, id);

CREATE INDEX posts_tsv_gin ON posts USING gin (tsv);

CREATE INDEX idx_recipe_bookmarks_recent_trending ON recipe_bookmarks USING btree (created_at DESC, parent_id, user_id);

CREATE INDEX user_bookmarks_parent_id_idx ON recipe_bookmarks USING btree (parent_id);

CREATE INDEX user_bookmarks_user_created_idx ON recipe_bookmarks USING btree (user_id, created_at DESC);

CREATE INDEX user_bookmarks_user_id_idx ON recipe_bookmarks USING btree (user_id);

CREATE INDEX idx_recipe_likes_recent_trending ON recipe_likes USING btree (created_at DESC, recipe_id, user_id) WHERE created_at IS NOT NULL;

CREATE INDEX idx_user_likes_recipe ON recipe_likes USING btree (recipe_id);

CREATE INDEX idx_user_likes_user ON recipe_likes USING btree (user_id);

CREATE INDEX index_user_likes_created_at_recipe ON recipe_likes USING btree (created_at, recipe_id);

CREATE INDEX idx_recipes_tags_gin ON recipes USING gin (tags);

CREATE INDEX idx_recipes_title_trgm ON recipes USING gin (title gin_trgm_ops);

CREATE INDEX idx_recipes_tsv ON recipes USING gin (tsv);

CREATE INDEX recipes_category_idx ON recipes USING btree (category);

CREATE INDEX user_follows_following_id_idx ON user_follows USING btree (following_id);

-- Application functions
CREATE OR REPLACE FUNCTION private.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from private.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION private.trending_window_start(p_period text)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  v_period text := lower(coalesce(p_period, 'week'));
  v_window interval;
begin
  v_window := case v_period
    when 'day' then interval '1 day'
    when 'week' then interval '7 days'
    when 'month' then interval '1 month'
  end;

  if v_window is null then
    raise exception 'unsupported trending period: %', p_period
      using errcode = '22023';
  end if;

  return statement_timestamp() - v_window;
end;
$function$;

CREATE OR REPLACE FUNCTION private.adjust_follow_counters()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  follower_user_id uuid;
  following_user_id uuid;
  counter_delta integer;
begin
  if tg_op = 'INSERT' then
    follower_user_id := new.follower_id;
    following_user_id := new.following_id;
    counter_delta := 1;
  elsif tg_op = 'DELETE' then
    follower_user_id := old.follower_id;
    following_user_id := old.following_id;
    counter_delta := -1;
  else
    raise exception 'UNSUPPORTED_FOLLOW_OPERATION';
  end if;

  update public.profiles
  set following_count = greatest(following_count + counter_delta, 0)
  where id = follower_user_id;

  update public.profiles
  set follower_count = greatest(follower_count + counter_delta, 0)
  where id = following_user_id;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION private.get_trending_combos_by_period(p_period text DEFAULT 'week'::text, p_limit_size integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, summary text, image text, tags text[], like_count integer, bookmark_count integer, comment_count integer, view_count integer, created_at timestamp with time zone, writer_uid uuid, writer_name text, recent_like_count bigint, recent_bookmark_count bigint, recent_comment_count bigint, recent_participant_count bigint, recent_activity_count bigint, trend_score bigint, last_activity_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with window_start as (
    select private.trending_window_start(p_period) as since
  ),
  recent_events as (
    select
      cl.combo_id as resource_id,
      cl.user_id,
      'like'::text as activity_type,
      cl.created_at
    from public.combo_likes cl
    where cl.created_at >= (select since from window_start)

    union all

    select
      cb.combo_id,
      cb.user_id,
      'bookmark'::text,
      cb.created_at
    from public.combo_bookmarks cb
    where cb.created_at >= (select since from window_start)

    union all

    select
      c.parent_id,
      c.writer_uid,
      'comment'::text,
      c.created_at
    from public.comments c
    where c.parent_type = 'combo'::public.comment_parent_type
      and c.deleted_at is null
      and c.created_at >= (select since from window_start)
  ),
  aggregated as (
    select
      e.resource_id,
      count(*) filter (where e.activity_type = 'like')::bigint as recent_like_count,
      count(*) filter (where e.activity_type = 'bookmark')::bigint as recent_bookmark_count,
      count(*) filter (where e.activity_type = 'comment')::bigint as recent_comment_count,
      count(distinct e.user_id)::bigint as recent_participant_count,
      count(*)::bigint as recent_activity_count,
      max(e.created_at) as last_activity_at
    from recent_events e
    group by e.resource_id
  )
  select
    c.id,
    c.title,
    c.summary,
    c.image,
    c.tags,
    c.like_count,
    c.bookmark_count,
    c.comment_count,
    c.view_count,
    c.created_at,
    c.writer_uid,
    c.writer_name,
    a.recent_like_count,
    a.recent_bookmark_count,
    a.recent_comment_count,
    a.recent_participant_count,
    a.recent_activity_count,
    (
      a.recent_participant_count * 10
      + a.recent_like_count * 2
      + a.recent_bookmark_count * 3
      + a.recent_comment_count * 4
    )::bigint as trend_score,
    a.last_activity_at
  from aggregated a
  join public.combos c on c.id = a.resource_id
  order by
    trend_score desc,
    a.recent_participant_count desc,
    a.recent_bookmark_count desc,
    c.id
  limit greatest(1, least(coalesce(p_limit_size, 10), 50));
$function$;

CREATE OR REPLACE FUNCTION private.get_trending_posts_by_period(p_period text DEFAULT 'week'::text, p_limit_size integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, summary text, image text, tags text[], like_count integer, bookmark_count integer, comment_count integer, view_count integer, created_at timestamp with time zone, writer_uid uuid, writer_name text, recent_like_count bigint, recent_bookmark_count bigint, recent_comment_count bigint, recent_participant_count bigint, recent_activity_count bigint, trend_score bigint, last_activity_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with window_start as (
    select private.trending_window_start(p_period) as since
  ),
  recent_events as (
    select
      pl.post_id as resource_id,
      pl.user_id,
      'like'::text as activity_type,
      pl.created_at
    from public.post_likes pl
    where pl.created_at >= (select since from window_start)

    union all

    select
      pb.post_id,
      pb.user_id,
      'bookmark'::text,
      pb.created_at
    from public.post_bookmarks pb
    where pb.created_at >= (select since from window_start)

    union all

    select
      c.parent_id,
      c.writer_uid,
      'comment'::text,
      c.created_at
    from public.comments c
    where c.parent_type = 'post'::public.comment_parent_type
      and c.deleted_at is null
      and c.created_at >= (select since from window_start)
  ),
  aggregated as (
    select
      e.resource_id,
      count(*) filter (where e.activity_type = 'like')::bigint as recent_like_count,
      count(*) filter (where e.activity_type = 'bookmark')::bigint as recent_bookmark_count,
      count(*) filter (where e.activity_type = 'comment')::bigint as recent_comment_count,
      count(distinct e.user_id)::bigint as recent_participant_count,
      count(*)::bigint as recent_activity_count,
      max(e.created_at) as last_activity_at
    from recent_events e
    group by e.resource_id
  )
  select
    p.id,
    p.title,
    nullif(left(coalesce(p.content_text, ''), 160), '') as summary,
    null::text as image,
    p.tags,
    p.like_count,
    p.bookmark_count,
    p.comment_count,
    p.view_count,
    p.created_at,
    p.writer_uid,
    p.writer_name,
    a.recent_like_count,
    a.recent_bookmark_count,
    a.recent_comment_count,
    a.recent_participant_count,
    a.recent_activity_count,
    (
      a.recent_participant_count * 10
      + a.recent_like_count * 2
      + a.recent_bookmark_count * 3
      + a.recent_comment_count * 4
    )::bigint as trend_score,
    a.last_activity_at
  from aggregated a
  join public.posts p on p.id = a.resource_id
  order by
    trend_score desc,
    a.recent_participant_count desc,
    a.recent_bookmark_count desc,
    p.id
  limit greatest(1, least(coalesce(p_limit_size, 10), 50));
$function$;

CREATE OR REPLACE FUNCTION private.get_trending_recipe_tags_by_period(p_period text DEFAULT 'week'::text, p_limit_size integer DEFAULT 10)
 RETURNS TABLE(tag text, recent_recipe_count bigint, total_recipe_count bigint, recent_like_count bigint, recent_bookmark_count bigint, recent_comment_count bigint, recent_participant_count bigint, recent_activity_count bigint, trend_score bigint, last_activity_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with window_start as (
    select private.trending_window_start(p_period) as since
  ),
  recent_events as (
    select
      rl.recipe_id as resource_id,
      rl.user_id,
      'like'::text as activity_type,
      rl.created_at
    from public.recipe_likes rl
    where rl.created_at >= (select since from window_start)

    union all

    select
      rb.parent_id,
      rb.user_id,
      'bookmark'::text,
      rb.created_at
    from public.recipe_bookmarks rb
    where rb.created_at >= (select since from window_start)

    union all

    select
      c.parent_id,
      c.writer_uid,
      'comment'::text,
      c.created_at
    from public.comments c
    where c.parent_type = 'recipe'::public.comment_parent_type
      and c.deleted_at is null
      and c.created_at >= (select since from window_start)
  ),
  tagged_events as (
    select
      trim(t.tag) as tag,
      e.resource_id,
      e.user_id,
      e.activity_type,
      e.created_at
    from recent_events e
    join public.recipes r on r.id = e.resource_id
    cross join lateral unnest(r.tags) as t(tag)
    where trim(t.tag) <> ''
  ),
  aggregated as (
    select
      e.tag,
      count(distinct e.resource_id)::bigint as recent_recipe_count,
      count(*) filter (where e.activity_type = 'like')::bigint as recent_like_count,
      count(*) filter (where e.activity_type = 'bookmark')::bigint as recent_bookmark_count,
      count(*) filter (where e.activity_type = 'comment')::bigint as recent_comment_count,
      count(distinct e.user_id)::bigint as recent_participant_count,
      count(*)::bigint as recent_activity_count,
      max(e.created_at) as last_activity_at
    from tagged_events e
    group by e.tag
  ),
  totals as (
    select
      trim(t.tag) as tag,
      count(distinct r.id)::bigint as total_recipe_count
    from public.recipes r
    cross join lateral unnest(r.tags) as t(tag)
    where trim(t.tag) <> ''
    group by trim(t.tag)
  )
  select
    a.tag,
    a.recent_recipe_count,
    coalesce(t.total_recipe_count, 0)::bigint,
    a.recent_like_count,
    a.recent_bookmark_count,
    a.recent_comment_count,
    a.recent_participant_count,
    a.recent_activity_count,
    (
      a.recent_participant_count * 10
      + a.recent_like_count * 2
      + a.recent_bookmark_count * 3
      + a.recent_comment_count * 4
    )::bigint as trend_score,
    a.last_activity_at
  from aggregated a
  left join totals t on t.tag = a.tag
  order by
    trend_score desc,
    a.recent_participant_count desc,
    a.recent_recipe_count desc,
    a.last_activity_at desc,
    a.tag
  limit greatest(1, least(coalesce(p_limit_size, 10), 50));
$function$;

CREATE OR REPLACE FUNCTION private.get_trending_recipes_by_period(p_period text DEFAULT 'week'::text, p_limit_size integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, summary text, image text, tags text[], like_count integer, bookmark_count integer, comment_count integer, view_count integer, created_at timestamp with time zone, writer_uid uuid, writer_name text, recent_like_count bigint, recent_bookmark_count bigint, recent_comment_count bigint, recent_participant_count bigint, recent_activity_count bigint, trend_score bigint, last_activity_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with window_start as (
    select private.trending_window_start(p_period) as since
  ),
  recent_events as (
    select
      rl.recipe_id as resource_id,
      rl.user_id,
      'like'::text as activity_type,
      rl.created_at
    from public.recipe_likes rl
    where rl.created_at >= (select since from window_start)

    union all

    select
      rb.parent_id,
      rb.user_id,
      'bookmark'::text,
      rb.created_at
    from public.recipe_bookmarks rb
    where rb.created_at >= (select since from window_start)

    union all

    select
      c.parent_id,
      c.writer_uid,
      'comment'::text,
      c.created_at
    from public.comments c
    where c.parent_type = 'recipe'::public.comment_parent_type
      and c.deleted_at is null
      and c.created_at >= (select since from window_start)
  ),
  aggregated as (
    select
      e.resource_id,
      count(*) filter (where e.activity_type = 'like')::bigint as recent_like_count,
      count(*) filter (where e.activity_type = 'bookmark')::bigint as recent_bookmark_count,
      count(*) filter (where e.activity_type = 'comment')::bigint as recent_comment_count,
      count(distinct e.user_id)::bigint as recent_participant_count,
      count(*)::bigint as recent_activity_count,
      max(e.created_at) as last_activity_at
    from recent_events e
    group by e.resource_id
  )
  select
    r.id,
    r.title,
    r.summary,
    r.image,
    r.tags,
    r.like_count,
    r.bookmark_count,
    r.comment_count,
    r.view_count,
    r.created_at,
    r.writer_uid,
    r.writer_name,
    a.recent_like_count,
    a.recent_bookmark_count,
    a.recent_comment_count,
    a.recent_participant_count,
    a.recent_activity_count,
    (
      a.recent_participant_count * 10
      + a.recent_like_count * 2
      + a.recent_bookmark_count * 3
      + a.recent_comment_count * 4
    )::bigint as trend_score,
    a.last_activity_at
  from aggregated a
  join public.recipes r on r.id = a.resource_id
  order by
    trend_score desc,
    a.recent_participant_count desc,
    a.recent_bookmark_count desc,
    r.id
  limit greatest(1, least(coalesce(p_limit_size, 10), 50));
$function$;

CREATE OR REPLACE FUNCTION private.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  profile_display_name text;
  profile_avatar_url text;
begin
  profile_display_name := left(
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      'user-' || left(new.id::text, 8)
    ),
    40
  );
  profile_avatar_url := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture',
    new.raw_user_meta_data ->> 'avatarUrl'
  );

  insert into public.profiles (id, display_name, photo_url, created_at, updated_at)
  values (new.id, profile_display_name, profile_avatar_url, new.created_at, coalesce(new.updated_at, now()))
  on conflict (id) do update
  set display_name = excluded.display_name,
      photo_url = excluded.photo_url,
      updated_at = excluded.updated_at;

  insert into private.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.adjust_content_engagement_counter()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_parent_id uuid;
  v_delta integer;
begin
  if tg_op = 'INSERT' then
    v_parent_id := (to_jsonb(new) ->> tg_argv[1])::uuid;
    v_delta := 1;
  elsif tg_op = 'DELETE' then
    v_parent_id := (to_jsonb(old) ->> tg_argv[1])::uuid;
    v_delta := -1;
  else
    raise exception 'UNSUPPORTED_ENGAGEMENT_OPERATION';
  end if;

  execute format(
    'update public.%I set %I = greatest(coalesce(%I, 0) + $1, 0) where id = $2',
    tg_argv[0],
    tg_argv[2],
    tg_argv[2]
  ) using v_delta, v_parent_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.bump_comment_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.deleted_at IS NULL THEN
    IF NEW.parent_type = 'post' THEN
      UPDATE public.posts SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = NEW.parent_id;
    ELSIF NEW.parent_type = 'recipe' THEN
      UPDATE public.recipes SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = NEW.parent_id;
    ELSIF NEW.parent_type = 'combo' THEN
      UPDATE public.combos SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = NEW.parent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.bump_post_comment_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.parent_type = 'post' and new.deleted_at is null then
    update public.posts set comment_count = coalesce(comment_count,0) + 1
    where id = new.parent_id;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.combo_toggle_like(p_combo_id uuid)
 RETURNS TABLE(liked boolean, like_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_inserted boolean;
  v_count integer;
begin
  if v_user_id is null then raise exception 'UNAUTHENTICATED'; end if;
  if not exists (select 1 from public.combos where id = p_combo_id) then
    raise exception 'COMBO_NOT_FOUND';
  end if;

  insert into public.combo_likes (user_id, combo_id)
  values (v_user_id, p_combo_id)
  on conflict do nothing
  returning true into v_inserted;

  if not coalesce(v_inserted, false) then
    delete from public.combo_likes
    where user_id = v_user_id and combo_id = p_combo_id;
  end if;

  select parent.like_count into v_count from public.combos parent where parent.id = p_combo_id;
  return query
  select exists (
    select 1 from public.combo_likes relation
    where relation.user_id = v_user_id and relation.combo_id = p_combo_id
  ), v_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.comments_set_writer()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.writer_uid is null then
    new.writer_uid := auth.uid();
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.drop_comment_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.deleted_at IS NULL THEN
    IF OLD.parent_type = 'post' THEN
      UPDATE public.posts SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0) WHERE id = OLD.parent_id;
    ELSIF OLD.parent_type = 'recipe' THEN
      UPDATE public.recipes SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0) WHERE id = OLD.parent_id;
    ELSIF OLD.parent_type = 'combo' THEN
      UPDATE public.combos SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0) WHERE id = OLD.parent_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.drop_post_comment_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if old.parent_type = 'post' and old.deleted_at is null then
    update public.posts set comment_count = greatest(coalesce(comment_count,0) - 1, 0)
    where id = old.parent_id;
  end if;
  return old;
end $function$;

CREATE OR REPLACE FUNCTION public.get_trending_combos_by_period(period text DEFAULT 'week'::text, limit_size integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, summary text, image text, tags text[], like_count integer, bookmark_count integer, comment_count integer, view_count integer, created_at timestamp with time zone, writer_uid uuid, writer_name text, recent_like_count bigint, recent_bookmark_count bigint, recent_comment_count bigint, recent_participant_count bigint, recent_activity_count bigint, trend_score bigint, last_activity_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
begin
  perform private.trending_window_start(period);
  return query
  select * from private.get_trending_combos_by_period(period, limit_size);
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_trending_posts_by_period(period text DEFAULT 'week'::text, limit_size integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, summary text, image text, tags text[], like_count integer, bookmark_count integer, comment_count integer, view_count integer, created_at timestamp with time zone, writer_uid uuid, writer_name text, recent_like_count bigint, recent_bookmark_count bigint, recent_comment_count bigint, recent_participant_count bigint, recent_activity_count bigint, trend_score bigint, last_activity_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
begin
  perform private.trending_window_start(period);
  return query
  select * from private.get_trending_posts_by_period(period, limit_size);
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_trending_recipe_tags_by_period(period text DEFAULT 'week'::text, limit_size integer DEFAULT 10)
 RETURNS TABLE(tag text, recent_recipe_count bigint, total_recipe_count bigint, recent_like_count bigint, recent_bookmark_count bigint, recent_comment_count bigint, recent_participant_count bigint, recent_activity_count bigint, trend_score bigint, last_activity_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
begin
  perform private.trending_window_start(period);
  return query
  select * from private.get_trending_recipe_tags_by_period(period, limit_size);
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_trending_recipes_by_period(period text DEFAULT 'week'::text, limit_size integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, summary text, image text, tags text[], like_count integer, bookmark_count integer, comment_count integer, view_count integer, created_at timestamp with time zone, writer_uid uuid, writer_name text, recent_like_count bigint, recent_bookmark_count bigint, recent_comment_count bigint, recent_participant_count bigint, recent_activity_count bigint, trend_score bigint, last_activity_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
begin
  perform private.trending_window_start(period);
  return query
  select * from private.get_trending_recipes_by_period(period, limit_size);
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_posts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- updated_at, view_count를 제외하고 값 변화가 있을 때만 수정 시간 갱신
  if (to_jsonb(new) - 'updated_at' - 'view_count')
       is distinct from
     (to_jsonb(old) - 'updated_at' - 'view_count') then
    new.updated_at = now();
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.increment_combo_view(p_combo_id uuid)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update combos
  set view_count = view_count + 1
  where id = p_combo_id
  returning view_count;
$function$;

CREATE OR REPLACE FUNCTION public.increment_post_view(p_post_id uuid)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update posts
  set view_count = view_count + 1
  where id = p_post_id
  returning view_count;
$function$;

CREATE OR REPLACE FUNCTION public.increment_recipe_view(p_recipe_id uuid)
 RETURNS recipes
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$update public.recipes
     set view_count = view_count + 1,
         updated_at = now()
   where id = p_recipe_id
  returning *;$function$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select private.is_admin();
$function$;

CREATE OR REPLACE FUNCTION public.post_toggle_like(p_post_id uuid)
 RETURNS TABLE(liked boolean, like_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_inserted boolean;
  v_count integer;
begin
  if v_user_id is null then raise exception 'UNAUTHENTICATED'; end if;
  if not exists (select 1 from public.posts where id = p_post_id) then
    raise exception 'POST_NOT_FOUND';
  end if;

  insert into public.post_likes (user_id, post_id)
  values (v_user_id, p_post_id)
  on conflict do nothing
  returning true into v_inserted;

  if not coalesce(v_inserted, false) then
    delete from public.post_likes
    where user_id = v_user_id and post_id = p_post_id;
  end if;

  select parent.like_count into v_count from public.posts parent where parent.id = p_post_id;
  return query
  select exists (
    select 1 from public.post_likes relation
    where relation.user_id = v_user_id and relation.post_id = p_post_id
  ), v_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.preserve_content_engagement_counters()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    new.like_count := old.like_count;
    new.bookmark_count := old.bookmark_count;
    new.view_count := old.view_count;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.preserve_follow_counters()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    new.follower_count := old.follower_count;
    new.following_count := old.following_count;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.recipe_toggle_like(p_recipe_id uuid)
 RETURNS TABLE(liked boolean, like_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_inserted boolean;
  v_count integer;
begin
  if v_user_id is null then raise exception 'UNAUTHENTICATED'; end if;
  if not exists (select 1 from public.recipes where id = p_recipe_id) then
    raise exception 'RECIPE_NOT_FOUND';
  end if;

  insert into public.recipe_likes (user_id, recipe_id)
  values (v_user_id, p_recipe_id)
  on conflict do nothing
  returning true into v_inserted;

  if not coalesce(v_inserted, false) then
    delete from public.recipe_likes
    where user_id = v_user_id and recipe_id = p_recipe_id;
  end if;

  select parent.like_count into v_count from public.recipes parent where parent.id = p_recipe_id;
  return query
  select exists (
    select 1 from public.recipe_likes relation
    where relation.user_id = v_user_id and relation.recipe_id = p_recipe_id
  ), v_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at := now();
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.set_writer_uid()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.writer_uid IS NULL THEN
    NEW.writer_uid := auth.uid();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_comment_count_on_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    -- 삭제됨 → 카운트 감소
    IF OLD.parent_type = 'post' THEN
      UPDATE public.posts SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0) WHERE id = OLD.parent_id;
    ELSIF OLD.parent_type = 'recipe' THEN
      UPDATE public.recipes SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0) WHERE id = OLD.parent_id;
    ELSIF OLD.parent_type = 'combo' THEN
      UPDATE public.combos SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0) WHERE id = OLD.parent_id;
    END IF;
  ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    -- 복원됨 → 카운트 증가
    IF OLD.parent_type = 'post' THEN
      UPDATE public.posts SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = OLD.parent_id;
    ELSIF OLD.parent_type = 'recipe' THEN
      UPDATE public.recipes SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = OLD.parent_id;
    ELSIF OLD.parent_type = 'combo' THEN
      UPDATE public.combos SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = OLD.parent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_post_comment_count_on_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if old.parent_type = 'post' then
    if old.deleted_at is null and new.deleted_at is not null then
      update public.posts set comment_count = greatest(coalesce(comment_count,0)-1,0)
      where id = old.parent_id;
    elsif old.deleted_at is not null and new.deleted_at is null then
      update public.posts set comment_count = coalesce(comment_count,0)+1
      where id = old.parent_id;
    end if;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.toggle_bookmark(p_type text, p_id uuid)
 RETURNS TABLE(bookmarked boolean, bookmark_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_inserted boolean;
  v_count integer;
begin
  if v_user_id is null then raise exception 'UNAUTHENTICATED'; end if;

  if p_type = 'recipe' then
    if not exists (select 1 from public.recipes where id = p_id) then
      raise exception 'RECIPE_NOT_FOUND';
    end if;
    insert into public.recipe_bookmarks (user_id, parent_id)
    values (v_user_id, p_id)
    on conflict do nothing
    returning true into v_inserted;
    if not coalesce(v_inserted, false) then
      delete from public.recipe_bookmarks where user_id = v_user_id and parent_id = p_id;
    end if;
    select parent.bookmark_count into v_count from public.recipes parent where parent.id = p_id;
    return query select exists (
      select 1 from public.recipe_bookmarks relation
      where relation.user_id = v_user_id and relation.parent_id = p_id
    ), v_count;
  elsif p_type = 'combo' then
    if not exists (select 1 from public.combos where id = p_id) then
      raise exception 'COMBO_NOT_FOUND';
    end if;
    insert into public.combo_bookmarks (user_id, combo_id)
    values (v_user_id, p_id)
    on conflict do nothing
    returning true into v_inserted;
    if not coalesce(v_inserted, false) then
      delete from public.combo_bookmarks where user_id = v_user_id and combo_id = p_id;
    end if;
    select parent.bookmark_count into v_count from public.combos parent where parent.id = p_id;
    return query select exists (
      select 1 from public.combo_bookmarks relation
      where relation.user_id = v_user_id and relation.combo_id = p_id
    ), v_count;
  elsif p_type = 'post' then
    if not exists (select 1 from public.posts where id = p_id) then
      raise exception 'POST_NOT_FOUND';
    end if;
    insert into public.post_bookmarks (user_id, post_id)
    values (v_user_id, p_id)
    on conflict do nothing
    returning true into v_inserted;
    if not coalesce(v_inserted, false) then
      delete from public.post_bookmarks where user_id = v_user_id and post_id = p_id;
    end if;
    select parent.bookmark_count into v_count from public.posts parent where parent.id = p_id;
    return query select exists (
      select 1 from public.post_bookmarks relation
      where relation.user_id = v_user_id and relation.post_id = p_id
    ), v_count;
  else
    raise exception 'INVALID_CONTENT_TYPE';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.toggle_follow(p_target_id uuid)
 RETURNS TABLE(following boolean, follower_count integer, following_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  follower_user_id uuid := auth.uid();
  inserted boolean;
  target_follower_count integer;
  self_following_count integer;
begin
  if follower_user_id is null then raise exception 'UNAUTHENTICATED'; end if;
  if follower_user_id = p_target_id then raise exception 'CANNOT_FOLLOW_SELF'; end if;
  if not exists (select 1 from public.profiles where id = p_target_id) then
    raise exception 'USER_NOT_FOUND';
  end if;

  insert into public.user_follows (follower_id, following_id)
  values (follower_user_id, p_target_id)
  on conflict do nothing
  returning true into inserted;

  if not coalesce(inserted, false) then
    delete from public.user_follows
    where follower_id = follower_user_id and following_id = p_target_id;
  end if;

  select profile.follower_count into target_follower_count
  from public.profiles profile where profile.id = p_target_id;
  select profile.following_count into self_following_count
  from public.profiles profile where profile.id = follower_user_id;

  return query
  select exists (
    select 1 from public.user_follows relation
    where relation.follower_id = follower_user_id and relation.following_id = p_target_id
  ), target_follower_count, self_following_count;
end;
$function$;

-- Views
create or replace view public.users with (security_invoker=true) as
 SELECT id,
    display_name,
    photo_url,
    created_at,
    updated_at,
    follower_count,
    following_count
   FROM profiles;

create or replace view public.users_public with (security_invoker=true) as
 SELECT id,
    display_name,
    photo_url,
    created_at,
    updated_at,
    follower_count,
    following_count
   FROM profiles;

-- Triggers
CREATE TRIGGER combo_bookmarks_sync_count AFTER INSERT OR DELETE ON combo_bookmarks FOR EACH ROW EXECUTE FUNCTION adjust_content_engagement_counter('combos', 'combo_id', 'bookmark_count');

CREATE TRIGGER combo_likes_sync_count AFTER INSERT OR DELETE ON combo_likes FOR EACH ROW EXECUTE FUNCTION adjust_content_engagement_counter('combos', 'combo_id', 'like_count');

CREATE TRIGGER combos_preserve_engagement_counts BEFORE UPDATE OF like_count, bookmark_count, view_count ON combos FOR EACH ROW EXECUTE FUNCTION preserve_content_engagement_counters();

CREATE TRIGGER combos_updated_at BEFORE UPDATE ON combos FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tr_comments_set_writer BEFORE INSERT ON comments FOR EACH ROW EXECUTE FUNCTION comments_set_writer();

CREATE TRIGGER trg_comments_after_delete AFTER DELETE ON comments FOR EACH ROW EXECUTE FUNCTION drop_comment_count();

CREATE TRIGGER trg_comments_after_insert AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION bump_comment_count();

CREATE TRIGGER trg_comments_after_update AFTER UPDATE OF deleted_at ON comments FOR EACH ROW EXECUTE FUNCTION sync_comment_count_on_update();

CREATE TRIGGER trg_comments_updated BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER post_bookmarks_sync_count AFTER INSERT OR DELETE ON post_bookmarks FOR EACH ROW EXECUTE FUNCTION adjust_content_engagement_counter('posts', 'post_id', 'bookmark_count');

CREATE TRIGGER post_likes_sync_count AFTER INSERT OR DELETE ON post_likes FOR EACH ROW EXECUTE FUNCTION adjust_content_engagement_counter('posts', 'post_id', 'like_count');

CREATE TRIGGER posts_preserve_engagement_counts BEFORE UPDATE OF like_count, bookmark_count, view_count ON posts FOR EACH ROW EXECUTE FUNCTION preserve_content_engagement_counters();

CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION handle_posts_updated_at();

CREATE TRIGGER profiles_preserve_follow_counts BEFORE UPDATE OF follower_count, following_count ON profiles FOR EACH ROW EXECUTE FUNCTION preserve_follow_counters();

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE OF display_name, photo_url ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER recipe_bookmarks_sync_count AFTER INSERT OR DELETE ON recipe_bookmarks FOR EACH ROW EXECUTE FUNCTION adjust_content_engagement_counter('recipes', 'parent_id', 'bookmark_count');

CREATE TRIGGER recipe_likes_sync_count AFTER INSERT OR DELETE ON recipe_likes FOR EACH ROW EXECUTE FUNCTION adjust_content_engagement_counter('recipes', 'recipe_id', 'like_count');

CREATE TRIGGER recipes_preserve_engagement_counts BEFORE UPDATE OF like_count, bookmark_count, view_count ON recipes FOR EACH ROW EXECUTE FUNCTION preserve_content_engagement_counters();

CREATE TRIGGER trg_recipes_set_writer BEFORE INSERT ON recipes FOR EACH ROW EXECUTE FUNCTION set_writer_uid();

CREATE TRIGGER trg_recipes_updated BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER user_follows_sync_count AFTER INSERT OR DELETE ON user_follows FOR EACH ROW EXECUTE FUNCTION private.adjust_follow_counters();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- Row level security
alter table private.user_roles enable row level security;

alter table public.combo_bookmarks enable row level security;

alter table public.combo_likes enable row level security;

alter table public.combo_recipe_ref enable row level security;

alter table public.combos enable row level security;

alter table public.comments enable row level security;

alter table public.post_bookmarks enable row level security;

alter table public.post_likes enable row level security;

alter table public.posts enable row level security;

alter table public.profiles enable row level security;

alter table public.recipe_bookmarks enable row level security;

alter table public.recipe_likes enable row level security;

alter table public.recipes enable row level security;

alter table public.user_follows enable row level security;

-- RLS policies
create policy combo_bookmarks_delete_own on public.combo_bookmarks as permissive for delete to authenticated
  using ((user_id = auth.uid()));

create policy combo_bookmarks_insert_own on public.combo_bookmarks as permissive for insert to authenticated
  with check ((user_id = auth.uid()));

create policy combo_bookmarks_select_own on public.combo_bookmarks as permissive for select to authenticated
  using ((user_id = auth.uid()));

create policy combo_likes_delete_own on public.combo_likes as permissive for delete to authenticated
  using ((user_id = auth.uid()));

create policy combo_likes_insert_own on public.combo_likes as permissive for insert to authenticated
  with check ((user_id = auth.uid()));

create policy combo_likes_select_own on public.combo_likes as permissive for select to authenticated
  using ((user_id = auth.uid()));

create policy combo_recipe_ref_owner_all on public.combo_recipe_ref as permissive for all to authenticated
  using ((EXISTS ( SELECT 1
   FROM combos c
  WHERE ((c.id = combo_recipe_ref.combo_id) AND (c.writer_uid = auth.uid())))))
  with check ((EXISTS ( SELECT 1
   FROM combos c
  WHERE ((c.id = combo_recipe_ref.combo_id) AND (c.writer_uid = auth.uid())))));

create policy combo_recipe_ref_select_all on public.combo_recipe_ref as permissive for select to public
  using (true);

create policy combos_delete_own_or_admin on public.combos as permissive for delete to authenticated
  using (((( SELECT auth.uid() AS uid) = writer_uid) OR ( SELECT private.is_admin() AS is_admin)));

create policy combos_insert_own on public.combos as permissive for insert to authenticated
  with check ((writer_uid = auth.uid()));

create policy combos_select_all on public.combos as permissive for select to public
  using (true);

create policy combos_update_own on public.combos as permissive for update to authenticated
  using ((( SELECT auth.uid() AS uid) = writer_uid))
  with check ((( SELECT auth.uid() AS uid) = writer_uid));

create policy comments_insert_own on public.comments as permissive for insert to authenticated
  with check ((writer_uid = auth.uid()));

create policy comments_select_all on public.comments as permissive for select to public
  using (true);

create policy comments_update_own on public.comments as permissive for update to authenticated
  using ((writer_uid = auth.uid()))
  with check ((writer_uid = auth.uid()));

create policy post_bookmarks_delete_own on public.post_bookmarks as permissive for delete to authenticated
  using ((user_id = auth.uid()));

create policy post_bookmarks_insert_own on public.post_bookmarks as permissive for insert to authenticated
  with check ((user_id = auth.uid()));

create policy post_bookmarks_select_own on public.post_bookmarks as permissive for select to authenticated
  using ((user_id = auth.uid()));

create policy post_likes_delete_own on public.post_likes as permissive for delete to authenticated
  using ((user_id = auth.uid()));

create policy post_likes_insert_own on public.post_likes as permissive for insert to authenticated
  with check ((user_id = auth.uid()));

create policy post_likes_select_own on public.post_likes as permissive for select to authenticated
  using ((user_id = auth.uid()));

create policy posts_delete_own_or_admin on public.posts as permissive for delete to authenticated
  using (((( SELECT auth.uid() AS uid) = writer_uid) OR ( SELECT private.is_admin() AS is_admin)));

create policy posts_insert_own_or_admin on public.posts as permissive for insert to authenticated
  with check (((( SELECT auth.uid() AS uid) = writer_uid) OR ( SELECT private.is_admin() AS is_admin)));

create policy posts_select_all on public.posts as permissive for select to public
  using (true);

create policy posts_update_own on public.posts as permissive for update to authenticated
  using ((( SELECT auth.uid() AS uid) = writer_uid))
  with check ((( SELECT auth.uid() AS uid) = writer_uid));

create policy profiles_select_public on public.profiles as permissive for select to anon, authenticated
  using (true);

create policy profiles_update_own on public.profiles as permissive for update to authenticated
  using ((( SELECT auth.uid() AS uid) = id))
  with check ((( SELECT auth.uid() AS uid) = id));

create policy recipe_bookmarks_delete_own on public.recipe_bookmarks as permissive for delete to authenticated
  using ((user_id = auth.uid()));

create policy recipe_bookmarks_insert_own on public.recipe_bookmarks as permissive for insert to authenticated
  with check ((user_id = auth.uid()));

create policy recipe_bookmarks_select_own on public.recipe_bookmarks as permissive for select to authenticated
  using ((user_id = auth.uid()));

create policy recipe_likes_delete_own on public.recipe_likes as permissive for delete to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id));

create policy recipe_likes_insert_own on public.recipe_likes as permissive for insert to authenticated
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy recipe_likes_select_own on public.recipe_likes as permissive for select to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id));

create policy insert_recipes_for_owner on public.recipes as permissive for insert to authenticated
  with check ((auth.uid() = writer_uid));

create policy recipes_delete_own_or_admin on public.recipes as permissive for delete to authenticated
  using (((( SELECT auth.uid() AS uid) = writer_uid) OR ( SELECT private.is_admin() AS is_admin)));

create policy recipes_select_all on public.recipes as permissive for select to public
  using (true);

create policy recipes_update_own on public.recipes as permissive for update to authenticated
  using ((( SELECT auth.uid() AS uid) = writer_uid))
  with check ((( SELECT auth.uid() AS uid) = writer_uid));

create policy user_follows_delete_own on public.user_follows as permissive for delete to authenticated
  using ((( SELECT auth.uid() AS uid) = follower_id));

create policy user_follows_insert_own on public.user_follows as permissive for insert to authenticated
  with check (((( SELECT auth.uid() AS uid) = follower_id) AND (follower_id <> following_id)));

create policy user_follows_select_public on public.user_follows as permissive for select to anon, authenticated
  using (true);

create policy delete_food_cafe_images_by_user on storage.objects as permissive for delete to authenticated
  using (((bucket_id = 'Food-Cafe'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));

create policy delete_post_images_by_owner on storage.objects as permissive for delete to authenticated
  using (((bucket_id = 'Food-Cafe'::text) AND (("substring"(name, '^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/'::text))::uuid IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = ("substring"(objects.name, '^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/'::text))::uuid) AND (p.writer_uid = auth.uid()))))));

create policy delete_recipe_images_by_owner on storage.objects as permissive for delete to authenticated
  using (((bucket_id = 'Food-Cafe'::text) AND (("substring"(name, '^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/'::text))::uuid IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = ("substring"(objects.name, '^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/'::text))::uuid) AND (r.writer_uid = auth.uid()))))));

create policy public_read_posts_images on storage.objects as permissive for select to public
  using (((bucket_id = 'Food-Cafe'::text) AND ((storage.foldername(name))[1] = 'posts'::text)));

create policy select_posts_temp_by_owner on storage.objects as permissive for select to authenticated
  using (((bucket_id = 'Food-Cafe'::text) AND ((storage.foldername(name))[1] = 'posts-temp'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));

create policy update_food_cafe_images_by_user on storage.objects as permissive for update to authenticated
  using (((bucket_id = 'Food-Cafe'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)))
  with check (((bucket_id = 'Food-Cafe'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));

create policy update_post_images_by_owner on storage.objects as permissive for update to authenticated
  using (((bucket_id = 'Food-Cafe'::text) AND (("substring"(name, '^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/'::text))::uuid IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = ("substring"(objects.name, '^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/'::text))::uuid) AND (p.writer_uid = auth.uid()))))))
  with check (((bucket_id = 'Food-Cafe'::text) AND (("substring"(name, '^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/'::text))::uuid IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = ("substring"(objects.name, '^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/'::text))::uuid) AND (p.writer_uid = auth.uid()))))));

create policy update_recipe_images_by_owner on storage.objects as permissive for update to authenticated
  using (((bucket_id = 'Food-Cafe'::text) AND (("substring"(name, '^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/'::text))::uuid IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = ("substring"(objects.name, '^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/'::text))::uuid) AND (r.writer_uid = auth.uid()))))))
  with check (((bucket_id = 'Food-Cafe'::text) AND (("substring"(name, '^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/'::text))::uuid IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = ("substring"(objects.name, '^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/'::text))::uuid) AND (r.writer_uid = auth.uid()))))));

create policy upload_food_cafe_images_by_user on storage.objects as permissive for insert to authenticated
  with check (((bucket_id = 'Food-Cafe'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));

-- Private schema permissions
revoke all privileges on schema private from public, anon, authenticated, service_role;
-- Private schema grants
grant usage on schema private to anon;

grant usage on schema private to authenticated;

grant usage on schema private to service_role;

-- Relation privilege reset
revoke all privileges on table private.user_roles from public, anon, authenticated, service_role;

revoke all privileges on sequence public.posts_number_seq from public, anon, authenticated, service_role;

revoke all privileges on table public.combo_bookmarks from public, anon, authenticated, service_role;

revoke all privileges on table public.combo_likes from public, anon, authenticated, service_role;

revoke all privileges on table public.combo_recipe_ref from public, anon, authenticated, service_role;

revoke all privileges on table public.combos from public, anon, authenticated, service_role;

revoke all privileges on table public.comments from public, anon, authenticated, service_role;

revoke all privileges on table public.post_bookmarks from public, anon, authenticated, service_role;

revoke all privileges on table public.post_likes from public, anon, authenticated, service_role;

revoke all privileges on table public.posts from public, anon, authenticated, service_role;

revoke all privileges on table public.profiles from public, anon, authenticated, service_role;

revoke all privileges on table public.recipe_bookmarks from public, anon, authenticated, service_role;

revoke all privileges on table public.recipe_likes from public, anon, authenticated, service_role;

revoke all privileges on table public.recipes from public, anon, authenticated, service_role;

revoke all privileges on table public.user_follows from public, anon, authenticated, service_role;

revoke all privileges on table public.users from public, anon, authenticated, service_role;

revoke all privileges on table public.users_public from public, anon, authenticated, service_role;

-- Relation grants
grant delete on table private.user_roles to service_role;

grant insert on table private.user_roles to service_role;

grant maintain on table private.user_roles to service_role;

grant references on table private.user_roles to service_role;

grant select on table private.user_roles to service_role;

grant trigger on table private.user_roles to service_role;

grant truncate on table private.user_roles to service_role;

grant update on table private.user_roles to service_role;

grant select on sequence public.posts_number_seq to anon;

grant update on sequence public.posts_number_seq to anon;

grant usage on sequence public.posts_number_seq to anon;

grant select on sequence public.posts_number_seq to authenticated;

grant update on sequence public.posts_number_seq to authenticated;

grant usage on sequence public.posts_number_seq to authenticated;

grant select on sequence public.posts_number_seq to service_role;

grant update on sequence public.posts_number_seq to service_role;

grant usage on sequence public.posts_number_seq to service_role;

grant select on table public.combo_bookmarks to authenticated;

grant delete on table public.combo_bookmarks to service_role;

grant insert on table public.combo_bookmarks to service_role;

grant maintain on table public.combo_bookmarks to service_role;

grant references on table public.combo_bookmarks to service_role;

grant select on table public.combo_bookmarks to service_role;

grant trigger on table public.combo_bookmarks to service_role;

grant truncate on table public.combo_bookmarks to service_role;

grant update on table public.combo_bookmarks to service_role;

grant select on table public.combo_likes to authenticated;

grant delete on table public.combo_likes to service_role;

grant insert on table public.combo_likes to service_role;

grant maintain on table public.combo_likes to service_role;

grant references on table public.combo_likes to service_role;

grant select on table public.combo_likes to service_role;

grant trigger on table public.combo_likes to service_role;

grant truncate on table public.combo_likes to service_role;

grant update on table public.combo_likes to service_role;

grant delete on table public.combo_recipe_ref to anon;

grant insert on table public.combo_recipe_ref to anon;

grant maintain on table public.combo_recipe_ref to anon;

grant references on table public.combo_recipe_ref to anon;

grant select on table public.combo_recipe_ref to anon;

grant trigger on table public.combo_recipe_ref to anon;

grant truncate on table public.combo_recipe_ref to anon;

grant update on table public.combo_recipe_ref to anon;

grant delete on table public.combo_recipe_ref to authenticated;

grant insert on table public.combo_recipe_ref to authenticated;

grant maintain on table public.combo_recipe_ref to authenticated;

grant references on table public.combo_recipe_ref to authenticated;

grant select on table public.combo_recipe_ref to authenticated;

grant trigger on table public.combo_recipe_ref to authenticated;

grant truncate on table public.combo_recipe_ref to authenticated;

grant update on table public.combo_recipe_ref to authenticated;

grant delete on table public.combo_recipe_ref to service_role;

grant insert on table public.combo_recipe_ref to service_role;

grant maintain on table public.combo_recipe_ref to service_role;

grant references on table public.combo_recipe_ref to service_role;

grant select on table public.combo_recipe_ref to service_role;

grant trigger on table public.combo_recipe_ref to service_role;

grant truncate on table public.combo_recipe_ref to service_role;

grant update on table public.combo_recipe_ref to service_role;

grant delete on table public.combos to anon;

grant insert on table public.combos to anon;

grant maintain on table public.combos to anon;

grant references on table public.combos to anon;

grant select on table public.combos to anon;

grant trigger on table public.combos to anon;

grant truncate on table public.combos to anon;

grant update on table public.combos to anon;

grant delete on table public.combos to authenticated;

grant insert on table public.combos to authenticated;

grant maintain on table public.combos to authenticated;

grant references on table public.combos to authenticated;

grant select on table public.combos to authenticated;

grant trigger on table public.combos to authenticated;

grant truncate on table public.combos to authenticated;

grant update on table public.combos to authenticated;

grant delete on table public.combos to service_role;

grant insert on table public.combos to service_role;

grant maintain on table public.combos to service_role;

grant references on table public.combos to service_role;

grant select on table public.combos to service_role;

grant trigger on table public.combos to service_role;

grant truncate on table public.combos to service_role;

grant update on table public.combos to service_role;

grant select on table public.comments to anon;

grant insert on table public.comments to authenticated;

grant select on table public.comments to authenticated;

grant delete on table public.comments to service_role;

grant insert on table public.comments to service_role;

grant maintain on table public.comments to service_role;

grant references on table public.comments to service_role;

grant select on table public.comments to service_role;

grant trigger on table public.comments to service_role;

grant truncate on table public.comments to service_role;

grant update on table public.comments to service_role;

grant select on table public.post_bookmarks to authenticated;

grant delete on table public.post_bookmarks to service_role;

grant insert on table public.post_bookmarks to service_role;

grant maintain on table public.post_bookmarks to service_role;

grant references on table public.post_bookmarks to service_role;

grant select on table public.post_bookmarks to service_role;

grant trigger on table public.post_bookmarks to service_role;

grant truncate on table public.post_bookmarks to service_role;

grant update on table public.post_bookmarks to service_role;

grant select on table public.post_likes to authenticated;

grant delete on table public.post_likes to service_role;

grant insert on table public.post_likes to service_role;

grant maintain on table public.post_likes to service_role;

grant references on table public.post_likes to service_role;

grant select on table public.post_likes to service_role;

grant trigger on table public.post_likes to service_role;

grant truncate on table public.post_likes to service_role;

grant update on table public.post_likes to service_role;

grant delete on table public.posts to anon;

grant insert on table public.posts to anon;

grant maintain on table public.posts to anon;

grant references on table public.posts to anon;

grant select on table public.posts to anon;

grant trigger on table public.posts to anon;

grant truncate on table public.posts to anon;

grant update on table public.posts to anon;

grant delete on table public.posts to authenticated;

grant insert on table public.posts to authenticated;

grant maintain on table public.posts to authenticated;

grant references on table public.posts to authenticated;

grant select on table public.posts to authenticated;

grant trigger on table public.posts to authenticated;

grant truncate on table public.posts to authenticated;

grant update on table public.posts to authenticated;

grant delete on table public.posts to service_role;

grant insert on table public.posts to service_role;

grant maintain on table public.posts to service_role;

grant references on table public.posts to service_role;

grant select on table public.posts to service_role;

grant trigger on table public.posts to service_role;

grant truncate on table public.posts to service_role;

grant update on table public.posts to service_role;

grant select on table public.profiles to anon;

grant select on table public.profiles to authenticated;

grant delete on table public.profiles to service_role;

grant insert on table public.profiles to service_role;

grant maintain on table public.profiles to service_role;

grant references on table public.profiles to service_role;

grant select on table public.profiles to service_role;

grant trigger on table public.profiles to service_role;

grant truncate on table public.profiles to service_role;

grant update on table public.profiles to service_role;

grant select on table public.recipe_bookmarks to authenticated;

grant delete on table public.recipe_bookmarks to service_role;

grant insert on table public.recipe_bookmarks to service_role;

grant maintain on table public.recipe_bookmarks to service_role;

grant references on table public.recipe_bookmarks to service_role;

grant select on table public.recipe_bookmarks to service_role;

grant trigger on table public.recipe_bookmarks to service_role;

grant truncate on table public.recipe_bookmarks to service_role;

grant update on table public.recipe_bookmarks to service_role;

grant select on table public.recipe_likes to authenticated;

grant delete on table public.recipe_likes to service_role;

grant insert on table public.recipe_likes to service_role;

grant maintain on table public.recipe_likes to service_role;

grant references on table public.recipe_likes to service_role;

grant select on table public.recipe_likes to service_role;

grant trigger on table public.recipe_likes to service_role;

grant truncate on table public.recipe_likes to service_role;

grant update on table public.recipe_likes to service_role;

grant delete on table public.recipes to anon;

grant insert on table public.recipes to anon;

grant maintain on table public.recipes to anon;

grant references on table public.recipes to anon;

grant select on table public.recipes to anon;

grant trigger on table public.recipes to anon;

grant truncate on table public.recipes to anon;

grant update on table public.recipes to anon;

grant delete on table public.recipes to authenticated;

grant insert on table public.recipes to authenticated;

grant maintain on table public.recipes to authenticated;

grant references on table public.recipes to authenticated;

grant select on table public.recipes to authenticated;

grant trigger on table public.recipes to authenticated;

grant truncate on table public.recipes to authenticated;

grant update on table public.recipes to authenticated;

grant delete on table public.recipes to service_role;

grant insert on table public.recipes to service_role;

grant maintain on table public.recipes to service_role;

grant references on table public.recipes to service_role;

grant select on table public.recipes to service_role;

grant trigger on table public.recipes to service_role;

grant truncate on table public.recipes to service_role;

grant update on table public.recipes to service_role;

grant select on table public.user_follows to anon;

grant select on table public.user_follows to authenticated;

grant delete on table public.user_follows to service_role;

grant insert on table public.user_follows to service_role;

grant maintain on table public.user_follows to service_role;

grant references on table public.user_follows to service_role;

grant select on table public.user_follows to service_role;

grant trigger on table public.user_follows to service_role;

grant truncate on table public.user_follows to service_role;

grant update on table public.user_follows to service_role;

grant select on table public.users to anon;

grant select on table public.users to authenticated;

grant delete on table public.users to service_role;

grant insert on table public.users to service_role;

grant maintain on table public.users to service_role;

grant references on table public.users to service_role;

grant select on table public.users to service_role;

grant trigger on table public.users to service_role;

grant truncate on table public.users to service_role;

grant update on table public.users to service_role;

grant select on table public.users_public to anon;

grant select on table public.users_public to authenticated;

grant delete on table public.users_public to service_role;

grant insert on table public.users_public to service_role;

grant maintain on table public.users_public to service_role;

grant references on table public.users_public to service_role;

grant select on table public.users_public to service_role;

grant trigger on table public.users_public to service_role;

grant truncate on table public.users_public to service_role;

grant update on table public.users_public to service_role;

-- Column-level grants
grant update (content, deleted_at) on table public.comments to authenticated;
grant update (display_name, photo_url) on table public.profiles to authenticated;
grant update (display_name, photo_url, updated_at) on table public.users to authenticated;

-- Function privilege reset
revoke all privileges on function private.adjust_follow_counters() from public, anon, authenticated, service_role;

revoke all privileges on function private.get_trending_combos_by_period(p_period text, p_limit_size integer) from public, anon, authenticated, service_role;

revoke all privileges on function private.get_trending_posts_by_period(p_period text, p_limit_size integer) from public, anon, authenticated, service_role;

revoke all privileges on function private.get_trending_recipe_tags_by_period(p_period text, p_limit_size integer) from public, anon, authenticated, service_role;

revoke all privileges on function private.get_trending_recipes_by_period(p_period text, p_limit_size integer) from public, anon, authenticated, service_role;

revoke all privileges on function private.handle_new_user() from public, anon, authenticated, service_role;

revoke all privileges on function private.is_admin() from public, anon, authenticated, service_role;

revoke all privileges on function private.trending_window_start(p_period text) from public, anon, authenticated, service_role;

revoke all privileges on function public.adjust_content_engagement_counter() from public, anon, authenticated, service_role;

revoke all privileges on function public.bump_comment_count() from public, anon, authenticated, service_role;

revoke all privileges on function public.bump_post_comment_count() from public, anon, authenticated, service_role;

revoke all privileges on function public.combo_toggle_like(p_combo_id uuid) from public, anon, authenticated, service_role;

revoke all privileges on function public.comments_set_writer() from public, anon, authenticated, service_role;

revoke all privileges on function public.drop_comment_count() from public, anon, authenticated, service_role;

revoke all privileges on function public.drop_post_comment_count() from public, anon, authenticated, service_role;

revoke all privileges on function public.get_trending_combos_by_period(period text, limit_size integer) from public, anon, authenticated, service_role;

revoke all privileges on function public.get_trending_posts_by_period(period text, limit_size integer) from public, anon, authenticated, service_role;

revoke all privileges on function public.get_trending_recipe_tags_by_period(period text, limit_size integer) from public, anon, authenticated, service_role;

revoke all privileges on function public.get_trending_recipes_by_period(period text, limit_size integer) from public, anon, authenticated, service_role;

revoke all privileges on function public.handle_posts_updated_at() from public, anon, authenticated, service_role;

revoke all privileges on function public.increment_combo_view(p_combo_id uuid) from public, anon, authenticated, service_role;

revoke all privileges on function public.increment_post_view(p_post_id uuid) from public, anon, authenticated, service_role;

revoke all privileges on function public.increment_recipe_view(p_recipe_id uuid) from public, anon, authenticated, service_role;

revoke all privileges on function public.is_current_user_admin() from public, anon, authenticated, service_role;

revoke all privileges on function public.post_toggle_like(p_post_id uuid) from public, anon, authenticated, service_role;

revoke all privileges on function public.preserve_content_engagement_counters() from public, anon, authenticated, service_role;

revoke all privileges on function public.preserve_follow_counters() from public, anon, authenticated, service_role;

revoke all privileges on function public.recipe_toggle_like(p_recipe_id uuid) from public, anon, authenticated, service_role;

revoke all privileges on function public.set_updated_at() from public, anon, authenticated, service_role;

revoke all privileges on function public.set_writer_uid() from public, anon, authenticated, service_role;

revoke all privileges on function public.sync_comment_count_on_update() from public, anon, authenticated, service_role;

revoke all privileges on function public.sync_post_comment_count_on_update() from public, anon, authenticated, service_role;

revoke all privileges on function public.toggle_bookmark(p_type text, p_id uuid) from public, anon, authenticated, service_role;

revoke all privileges on function public.toggle_follow(p_target_id uuid) from public, anon, authenticated, service_role;

revoke all privileges on function public.uuid_v7() from public, anon, authenticated, service_role;

-- Function grants
grant execute on function private.adjust_follow_counters() to service_role;

grant execute on function private.get_trending_combos_by_period(p_period text, p_limit_size integer) to anon;

grant execute on function private.get_trending_combos_by_period(p_period text, p_limit_size integer) to authenticated;

grant execute on function private.get_trending_combos_by_period(p_period text, p_limit_size integer) to service_role;

grant execute on function private.get_trending_posts_by_period(p_period text, p_limit_size integer) to anon;

grant execute on function private.get_trending_posts_by_period(p_period text, p_limit_size integer) to authenticated;

grant execute on function private.get_trending_posts_by_period(p_period text, p_limit_size integer) to service_role;

grant execute on function private.get_trending_recipe_tags_by_period(p_period text, p_limit_size integer) to anon;

grant execute on function private.get_trending_recipe_tags_by_period(p_period text, p_limit_size integer) to authenticated;

grant execute on function private.get_trending_recipe_tags_by_period(p_period text, p_limit_size integer) to service_role;

grant execute on function private.get_trending_recipes_by_period(p_period text, p_limit_size integer) to anon;

grant execute on function private.get_trending_recipes_by_period(p_period text, p_limit_size integer) to authenticated;

grant execute on function private.get_trending_recipes_by_period(p_period text, p_limit_size integer) to service_role;

grant execute on function private.handle_new_user() to service_role;

grant execute on function private.is_admin() to authenticated;

grant execute on function private.is_admin() to service_role;

grant execute on function private.trending_window_start(p_period text) to anon;

grant execute on function private.trending_window_start(p_period text) to authenticated;

grant execute on function private.trending_window_start(p_period text) to service_role;

grant execute on function public.adjust_content_engagement_counter() to service_role;

grant execute on function public.bump_comment_count() to anon;

grant execute on function public.bump_comment_count() to authenticated;

grant execute on function public.bump_comment_count() to public;

grant execute on function public.bump_comment_count() to service_role;

grant execute on function public.bump_post_comment_count() to anon;

grant execute on function public.bump_post_comment_count() to authenticated;

grant execute on function public.bump_post_comment_count() to public;

grant execute on function public.bump_post_comment_count() to service_role;

grant execute on function public.combo_toggle_like(p_combo_id uuid) to authenticated;

grant execute on function public.combo_toggle_like(p_combo_id uuid) to service_role;

grant execute on function public.comments_set_writer() to service_role;

grant execute on function public.drop_comment_count() to anon;

grant execute on function public.drop_comment_count() to authenticated;

grant execute on function public.drop_comment_count() to public;

grant execute on function public.drop_comment_count() to service_role;

grant execute on function public.drop_post_comment_count() to anon;

grant execute on function public.drop_post_comment_count() to authenticated;

grant execute on function public.drop_post_comment_count() to public;

grant execute on function public.drop_post_comment_count() to service_role;

grant execute on function public.get_trending_combos_by_period(period text, limit_size integer) to anon;

grant execute on function public.get_trending_combos_by_period(period text, limit_size integer) to authenticated;

grant execute on function public.get_trending_combos_by_period(period text, limit_size integer) to service_role;

grant execute on function public.get_trending_posts_by_period(period text, limit_size integer) to anon;

grant execute on function public.get_trending_posts_by_period(period text, limit_size integer) to authenticated;

grant execute on function public.get_trending_posts_by_period(period text, limit_size integer) to service_role;

grant execute on function public.get_trending_recipe_tags_by_period(period text, limit_size integer) to anon;

grant execute on function public.get_trending_recipe_tags_by_period(period text, limit_size integer) to authenticated;

grant execute on function public.get_trending_recipe_tags_by_period(period text, limit_size integer) to service_role;

grant execute on function public.get_trending_recipes_by_period(period text, limit_size integer) to anon;

grant execute on function public.get_trending_recipes_by_period(period text, limit_size integer) to authenticated;

grant execute on function public.get_trending_recipes_by_period(period text, limit_size integer) to service_role;

grant execute on function public.handle_posts_updated_at() to anon;

grant execute on function public.handle_posts_updated_at() to authenticated;

grant execute on function public.handle_posts_updated_at() to public;

grant execute on function public.handle_posts_updated_at() to service_role;

grant execute on function public.increment_combo_view(p_combo_id uuid) to anon;

grant execute on function public.increment_combo_view(p_combo_id uuid) to authenticated;

grant execute on function public.increment_combo_view(p_combo_id uuid) to public;

grant execute on function public.increment_combo_view(p_combo_id uuid) to service_role;

grant execute on function public.increment_post_view(p_post_id uuid) to anon;

grant execute on function public.increment_post_view(p_post_id uuid) to authenticated;

grant execute on function public.increment_post_view(p_post_id uuid) to public;

grant execute on function public.increment_post_view(p_post_id uuid) to service_role;

grant execute on function public.increment_recipe_view(p_recipe_id uuid) to anon;

grant execute on function public.increment_recipe_view(p_recipe_id uuid) to authenticated;

grant execute on function public.increment_recipe_view(p_recipe_id uuid) to public;

grant execute on function public.increment_recipe_view(p_recipe_id uuid) to service_role;

grant execute on function public.is_current_user_admin() to authenticated;

grant execute on function public.is_current_user_admin() to service_role;

grant execute on function public.post_toggle_like(p_post_id uuid) to authenticated;

grant execute on function public.post_toggle_like(p_post_id uuid) to service_role;

grant execute on function public.preserve_content_engagement_counters() to service_role;

grant execute on function public.preserve_follow_counters() to service_role;

grant execute on function public.recipe_toggle_like(p_recipe_id uuid) to authenticated;

grant execute on function public.recipe_toggle_like(p_recipe_id uuid) to service_role;

grant execute on function public.set_updated_at() to anon;

grant execute on function public.set_updated_at() to authenticated;

grant execute on function public.set_updated_at() to public;

grant execute on function public.set_updated_at() to service_role;

grant execute on function public.set_writer_uid() to anon;

grant execute on function public.set_writer_uid() to authenticated;

grant execute on function public.set_writer_uid() to public;

grant execute on function public.set_writer_uid() to service_role;

grant execute on function public.sync_comment_count_on_update() to anon;

grant execute on function public.sync_comment_count_on_update() to authenticated;

grant execute on function public.sync_comment_count_on_update() to public;

grant execute on function public.sync_comment_count_on_update() to service_role;

grant execute on function public.sync_post_comment_count_on_update() to anon;

grant execute on function public.sync_post_comment_count_on_update() to authenticated;

grant execute on function public.sync_post_comment_count_on_update() to public;

grant execute on function public.sync_post_comment_count_on_update() to service_role;

grant execute on function public.toggle_bookmark(p_type text, p_id uuid) to authenticated;

grant execute on function public.toggle_bookmark(p_type text, p_id uuid) to service_role;

grant execute on function public.toggle_follow(p_target_id uuid) to authenticated;

grant execute on function public.toggle_follow(p_target_id uuid) to service_role;

grant execute on function public.uuid_v7() to anon;

grant execute on function public.uuid_v7() to authenticated;

grant execute on function public.uuid_v7() to public;

grant execute on function public.uuid_v7() to service_role;

-- Database comments
comment on column public.posts.category is 'Community category: free, recipe_tip, question, or review.';

comment on column public.recipes.chef_tip is 'Optional chef tip shown on recipe detail pages.';

commit;
