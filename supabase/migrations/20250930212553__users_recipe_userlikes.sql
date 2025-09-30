-- =========================================================
--  users / recipes / user_likes migration (idempotent)
--  Note: 실제 DB에서 이미지 컬럼명이 image_path 라면 아래의 image 레퍼런스를 image_path 로 교체하세요.
-- =========================================================
begin;

-- 0) 안전 가드: 스키마 존재
create schema if not exists public;

-- 1) USERS: 컬럼 표준화 및 보강
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

-- 파생(admin): role='admin'이면 true
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='users' and column_name='is_admin') then
    alter table public.users
      add column is_admin boolean generated always as (role = 'admin') stored;
  end if;
end $$;

-- (선택) 없으면 is_admin(uid) 함수 생성 - SECURITY DEFINER
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

-- 2) RECIPES: 작성자 FK + 자동 주입 트리거 + 이미지 규칙
-- FK (존재 확인 후 추가)
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

-- writer_uid 자동 주입 트리거 (없으면 생성/갱신)
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

-- 이미지 필수 CHECK (빈 문자열 방지). NOT NULL은 레거시 백필 완료 후 별도 적용 권장.
alter table public.recipes
  drop constraint if exists recipes_image_required;

alter table public.recipes
  add constraint recipes_image_required
  check (coalesce(nullif(trim(image), ''), null) is not null);

-- 필요 시, 백필 완료 후 아래 주석 해제
-- alter table public.recipes
--   alter column image set not null;

-- 3) USER_LIKES: 연결 테이블 + 인덱스 + RLS
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

-- 4) USERS 테이블 RLS(참고: 기존 규칙 유지/갱신)
-- 필요한 경우에만 활성화/갱신하세요. (이미 있다면 스킵됨)
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


