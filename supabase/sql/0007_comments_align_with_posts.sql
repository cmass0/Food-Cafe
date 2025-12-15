begin;

-- 0) 기존 정책/트리거 정리
drop policy if exists comments_select_all on public.comments;
drop policy if exists comments_insert_own on public.comments;
drop policy if exists comments_update_own on public.comments;
drop policy if exists comments_delete_own on public.comments;
-- also drop legacy policy names from earlier migrations (owner_or_admin variants)
drop policy if exists comments_insert_own_or_admin on public.comments;
drop policy if exists comments_update_own_or_admin on public.comments;
drop policy if exists comments_delete_own_or_admin on public.comments;
drop trigger if exists tr_comments_set_writer on public.comments;
drop trigger if exists trg_comments_updated on public.comments;
drop trigger if exists trg_comments_after_insert on public.comments;
drop trigger if exists trg_comments_after_delete on public.comments;
drop trigger if exists trg_comments_after_update on public.comments;

-- 1) 컬럼 표준화
alter table public.comments rename column author_id to writer_uid;
alter table public.comments rename column body to content;
alter table public.comments alter column writer_uid drop not null;

-- 2) 표시/갱신 컬럼
alter table public.comments
  add column if not exists writer_name text not null default '';
alter table public.comments
  add column if not exists updated_at timestamptz not null default now();

-- 3) FK(auth.users) 정렬 (작성자 탈퇴 시 댓글은 남기되 익명화)
alter table public.comments drop constraint if exists comments_author_id_fkey;
alter table public.comments drop constraint if exists comments_writer_uid_fkey;
alter table public.comments
  add constraint comments_writer_uid_fkey
    foreign key (writer_uid) references auth.users(id) on delete set null;

-- 4) 유틸 함수(없으면 생성)
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- 작성자 uid 주입
create or replace function public.comments_set_writer() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.writer_uid is null then
    new.writer_uid := auth.uid();
  end if;
  return new;
end $$;

-- 5) 트리거 설정
create trigger tr_comments_set_writer
before insert on public.comments
for each row execute function public.comments_set_writer();

create trigger trg_comments_updated
before update on public.comments
for each row execute function public.set_updated_at();

-- 6) 인덱스(조회 최적화)
create index if not exists idx_comments_parent_created_at
  on public.comments (parent_type, parent_id, created_at desc);
create index if not exists idx_comments_writer_created_at
  on public.comments (writer_uid, created_at desc);

-- 7) (선택) posts.comment_count 지원 원하면: 컬럼+트리거
alter table public.posts
  add column if not exists comment_count int not null default 0;

create or replace function public.bump_post_comment_count() returns trigger
language plpgsql as $$
begin
  if new.parent_type = 'post' and new.deleted_at is null then
    update public.posts set comment_count = coalesce(comment_count,0) + 1
    where id = new.parent_id;
  end if;
  return new;
end $$;

create or replace function public.drop_post_comment_count() returns trigger
language plpgsql as $$
begin
  if old.parent_type = 'post' and old.deleted_at is null then
    update public.posts set comment_count = greatest(coalesce(comment_count,0) - 1, 0)
    where id = old.parent_id;
  end if;
  return old;
end $$;

create or replace function public.sync_post_comment_count_on_update() returns trigger
language plpgsql as $$
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
end $$;

create trigger trg_comments_after_insert
after insert on public.comments
for each row execute function public.bump_post_comment_count();

create trigger trg_comments_after_delete
after delete on public.comments
for each row execute function public.drop_post_comment_count();

create trigger trg_comments_after_update
after update on public.comments
for each row
when (old.deleted_at is distinct from new.deleted_at)
execute function public.sync_post_comment_count_on_update();

-- 8) RLS (관리자 예외 없이, 본인만 조작 / 조회는 모두 허용)
alter table public.comments enable row level security;

create policy comments_select_all on public.comments
  for select using (true);  -- 삭제된 것도 조회 → FE에서 "삭제된 댓글입니다" 렌더

create policy comments_insert_own on public.comments
  for insert to authenticated
  with check (writer_uid = auth.uid());

create policy comments_update_own on public.comments
  for update to authenticated
  using (writer_uid = auth.uid())
  with check (writer_uid = auth.uid());

create policy comments_delete_own on public.comments
  for delete to authenticated
  using (writer_uid = auth.uid());

commit;
