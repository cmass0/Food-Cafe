-- Combo feature schema (combos, refs, likes/bookmarks, view/like RPC, comment count)


alter type public.comment_parent_type add value if not exists 'combo';

-- 2) combo테이블 생성
create table if not exists public.combos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  steps text,
  items jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  difficulty text,
  time_minutes integer,
  tools_required boolean not null default false,
  image text,
  like_count integer not null default 0,
  view_count integer not null default 0,
  comment_count integer not null default 0,
  writer_uid uuid references auth.users(id) on delete set null,
  writer_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tsv tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(steps, '') || ' ' || array_to_string(tags, ' ')
    )
  ) stored
);

-- 3) combo 테이블 인덱스 설정
create index if not exists idx_combos_created_at on public.combos (created_at desc, id);
create index if not exists idx_combos_tags_gin on public.combos using gin (tags);
create index if not exists idx_combos_tsv_gin on public.combos using gin (tsv);

create trigger trg_combos_updated
before update on public.combos
for each row execute function public.set_updated_at();


-- 4) 레시피 참조, 조합 좋아요, 조합 북마크 테이블 생성
create table if not exists public.combo_recipe_refs (
  combo_id uuid not null references public.combos(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (combo_id, recipe_id)
);
create index if not exists idx_combo_recipe_refs_recipe on public.combo_recipe_refs (recipe_id, sort_order);


create table if not exists public.combo_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  combo_id uuid not null references public.combos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, combo_id)
);

create table if not exists public.combo_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  combo_id uuid not null references public.combos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, combo_id)
);

-- 5) RLS
alter table public.combos enable row level security;
alter table public.combo_likes enable row level security;
alter table public.combo_bookmarks enable row level security;
alter table public.combo_recipe_refs enable row level security;


drop policy if exists combos_select_all on public.combos;
create policy combos_select_all on public.combos for select using (true);

drop policy if exists combos_insert_own on public.combos;
create policy combos_insert_own on public.combos
  for insert to authenticated
  with check (writer_uid = auth.uid());

drop policy if exists combos_update_own on public.combos;
create policy combos_update_own on public.combos
  for update to authenticated
  using (writer_uid = auth.uid())
  with check (writer_uid = auth.uid());

drop policy if exists combos_delete_own_or_admin on public.combos;
create policy combos_delete_own_or_admin on public.combos
  for delete to authenticated
  using (writer_uid = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists combo_likes_select_all on public.combo_likes;
create policy combo_likes_select_all on public.combo_likes for select using (true);

drop policy if exists combo_likes_insert_own on public.combo_likes;
create policy combo_likes_insert_own on public.combo_likes
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists combo_likes_delete_own on public.combo_likes;
create policy combo_likes_delete_own on public.combo_likes
  for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists combo_bookmarks_select_all on public.combo_bookmarks;
create policy combo_bookmarks_select_all on public.combo_bookmarks for select using (true);

drop policy if exists combo_bookmarks_insert_own on public.combo_bookmarks;
create policy combo_bookmarks_insert_own on public.combo_bookmarks
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists combo_bookmarks_delete_own on public.combo_bookmarks;
create policy combo_bookmarks_delete_own on public.combo_bookmarks
  for delete to authenticated
  using (user_id = auth.uid());


drop policy if exists combo_recipe_refs_select_all on public.combo_recipe_refs;
create policy combo_recipe_refs_select_all on public.combo_recipe_refs for select using (true);


drop policy if exists combo_recipe_refs_write_authenticated on public.combo_recipe_refs;
create policy combo_recipe_refs_write_authenticated on public.combo_recipe_refs
  for all to authenticated
  using (
    exists (
      select 1 from public.combos c
      where c.id = combo_id
        and (c.writer_uid = auth.uid() or public.is_admin(auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.combos c
      where c.id = combo_id
        and (c.writer_uid = auth.uid() or public.is_admin(auth.uid()))
    )
  );

-- 6) toggle 좋아요 증가 rpc 설정 (recipe like쪽 참고)
create or replace function public.increment_combo_view(p_combo_id uuid)
returns public.combos
language sql
security definer
set search_path = public
as $$
  update public.combos
     set view_count = coalesce(view_count, 0) + 1,
         updated_at = now()
   where id = p_combo_id
  returning *;
$$;

create or replace function public.combo_toggle_like(p_combo_id uuid)
returns table (liked boolean, like_count int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_delta int := 0;
  v_like_count int;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  insert into public.combo_likes(user_id, combo_id)
  values (v_user_id, p_combo_id)
  on conflict do nothing;

  if found then
    v_delta := 1;
  else
    delete from public.combo_likes
     where user_id = v_user_id and combo_id = p_combo_id;
    v_delta := case when found then -1 else 0 end;
  end if;

  update public.combos
     set like_count = greatest(coalesce(like_count, 0) + v_delta, 0),
         updated_at = now()
   where id = p_combo_id
  returning public.combos.like_count into v_like_count;

  like_count := v_like_count;

  select exists (
    select 1 from public.combo_likes
     where user_id = v_user_id and combo_id = p_combo_id
  ) into liked;

  return next;
end $$;

-- 7) ��� count Ʈ���� Ȯ�� (post + combo)
drop trigger if exists trg_comments_after_insert on public.comments;
drop trigger if exists trg_comments_after_delete on public.comments;
drop trigger if exists trg_comments_after_update on public.comments;

create or replace function public.bump_comment_count() returns trigger
language plpgsql as $$
begin
  if new.deleted_at is null then
    if new.parent_type = 'post' then
      update public.posts set comment_count = coalesce(comment_count, 0) + 1
      where id = new.parent_id;
    elsif new.parent_type = 'combo' then
      update public.combos set comment_count = coalesce(comment_count, 0) + 1
      where id = new.parent_id;
    end if;
  end if;
  return new;
end $$;

create or replace function public.drop_comment_count() returns trigger
language plpgsql as $$
begin
  if old.deleted_at is null then
    if old.parent_type = 'post' then
      update public.posts set comment_count = greatest(coalesce(comment_count, 0) - 1, 0)
      where id = old.parent_id;
    elsif old.parent_type = 'combo' then
      update public.combos set comment_count = greatest(coalesce(comment_count, 0) - 1, 0)
      where id = old.parent_id;
    end if;
  end if;
  return old;
end $$;

create or replace function public.sync_comment_count_on_update() returns trigger
language plpgsql as $$
begin
  if old.parent_type = 'post' then
    if old.deleted_at is null and new.deleted_at is not null then
      update public.posts set comment_count = greatest(coalesce(comment_count, 0) - 1, 0)
      where id = old.parent_id;
    elsif old.deleted_at is not null and new.deleted_at is null then
      update public.posts set comment_count = coalesce(comment_count, 0) + 1
      where id = old.parent_id;
    end if;
  elsif old.parent_type = 'combo' then
    if old.deleted_at is null and new.deleted_at is not null then
      update public.combos set comment_count = greatest(coalesce(comment_count, 0) - 1, 0)
      where id = old.parent_id;
    elsif old.deleted_at is not null and new.deleted_at is null then
      update public.combos set comment_count = coalesce(comment_count, 0) + 1
      where id = old.parent_id;
    end if;
  end if;
  return new;
end $$;

create trigger trg_comments_after_insert
after insert on public.comments
for each row execute function public.bump_comment_count();

create trigger trg_comments_after_delete
after delete on public.comments
for each row execute function public.drop_comment_count();

create trigger trg_comments_after_update
after update on public.comments
for each row
when (old.deleted_at is distinct from new.deleted_at)
execute function public.sync_comment_count_on_update();
