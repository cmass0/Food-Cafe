-- 좋아요·북마크·팔로우 쓰기를 "원하는 상태를 지정하는" RPC로 통일한다.
--   공통 로직: private.set_relation (클라이언트가 직접 호출할 수 없음)
--   입구: set_<대상>_like / set_<대상>_bookmark / set_follow (로그인 사용자만)
-- 같은 요청을 여러 번 보내도 결과가 같으므로(멱등) 연속 클릭에도 상태가 뒤집히지 않는다.

-- 1. recipe_bookmarks를 다른 관계 테이블과 같은 구조로 맞춘다 ----------------
--    (user_id, recipe_id) 복합 기본키, 쓰이지 않는 id 컬럼 삭제, 옛 이름 정리

alter table public.recipe_bookmarks drop constraint user_bookmarks_pkey;
alter table public.recipe_bookmarks drop column id;
alter table public.recipe_bookmarks rename column parent_id to recipe_id;
alter table public.recipe_bookmarks drop constraint user_bookmarks_user_id_parent_id_key;
alter table public.recipe_bookmarks add constraint recipe_bookmarks_pkey primary key (user_id, recipe_id);
alter table public.recipe_bookmarks rename constraint user_bookmarks_parent_id_fkey to recipe_bookmarks_recipe_id_fkey;
alter table public.recipe_bookmarks rename constraint user_bookmarks_user_id_fkey to recipe_bookmarks_user_id_fkey;

-- 기본키 (user_id, recipe_id)가 user_id 조회를 대신한다.
drop index public.user_bookmarks_user_id_idx;
drop index public.user_bookmarks_parent_id_idx;
create index idx_recipe_bookmarks_recipe on public.recipe_bookmarks (recipe_id, created_at desc);
alter index public.user_bookmarks_user_created_idx rename to idx_recipe_bookmarks_user_created_at;

-- 카운터 트리거는 컬럼 이름을 문자열 인자로 받으므로 다시 만든다.
drop trigger trg_recipe_bookmarks_sync_count on public.recipe_bookmarks;
create trigger trg_recipe_bookmarks_sync_count
  after insert or delete on public.recipe_bookmarks
  for each row execute function private.sync_engagement_count('recipes', 'recipe_id', 'bookmark_count');

-- SQL 함수 본문은 실행할 때 해석되므로, 옛 컬럼 이름을 쓰는 트렌딩 함수 두 개를 새 이름으로 다시 정의한다.
-- CREATE OR REPLACE는 함수 oid와 실행 권한을 유지한다.
do $$
declare
  v_function regprocedure;
  v_definition text;
begin
  foreach v_function in array array[
    'private.get_trending_recipes_by_period(text, integer)'::regprocedure,
    'private.get_trending_recipe_tags_by_period(text, integer)'::regprocedure
  ] loop
    v_definition := pg_get_functiondef(v_function);
    if position('rb.parent_id' in v_definition) = 0 then
      raise exception '% 에서 rb.parent_id를 찾지 못했습니다', v_function;
    end if;
    execute replace(v_definition, 'rb.parent_id', 'rb.recipe_id');
  end loop;
end;
$$;

-- 2. 공통 로직 -----------------------------------------------------------------

create function private.set_relation(
  p_relation text,
  p_parent text,
  p_parent_column text,
  p_count_column text,
  p_parent_id uuid,
  p_active boolean
)
returns table (active boolean, total integer)
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_parent_exists boolean;
  v_total integer;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;
  if p_active is null then
    raise exception 'STATE_REQUIRED' using errcode = '22004';
  end if;

  execute format('select exists (select 1 from public.%I where id = $1)', p_parent)
    into v_parent_exists using p_parent_id;
  if not v_parent_exists then
    return;
  end if;

  if p_active then
    execute format(
      'insert into public.%I (user_id, %I) values ($1, $2) on conflict do nothing',
      p_relation, p_parent_column
    ) using v_user_id, p_parent_id;
  else
    execute format(
      'delete from public.%I where user_id = $1 and %I = $2',
      p_relation, p_parent_column
    ) using v_user_id, p_parent_id;
  end if;

  -- 개수는 private.sync_engagement_count 트리거가 같은 트랜잭션에서 이미 갱신했다.
  execute format('select %I from public.%I where id = $1', p_count_column, p_parent)
    into v_total using p_parent_id;

  return query select p_active, v_total;
end;
$$;

comment on function private.set_relation(text, text, text, text, uuid, boolean) is
  '로그인 사용자와 콘텐츠의 관계(좋아요·북마크)를 지정한 상태로 맞추고 현재 상태와 개수를 반환한다. 대상이 없으면 빈 결과. 테이블·컬럼 이름은 public 입구 함수의 고정값만 받는다.';

revoke all on function private.set_relation(text, text, text, text, uuid, boolean)
  from public, anon, authenticated;

-- 3. 입구: 좋아요 ---------------------------------------------------------------

create function public.set_recipe_like(p_recipe_id uuid, p_liked boolean)
returns table (liked boolean, like_count integer)
language sql security definer set search_path = ''
as $$
  select * from private.set_relation('recipe_likes', 'recipes', 'recipe_id', 'like_count', p_recipe_id, p_liked);
$$;

create function public.set_post_like(p_post_id uuid, p_liked boolean)
returns table (liked boolean, like_count integer)
language sql security definer set search_path = ''
as $$
  select * from private.set_relation('post_likes', 'posts', 'post_id', 'like_count', p_post_id, p_liked);
$$;

create function public.set_combo_like(p_combo_id uuid, p_liked boolean)
returns table (liked boolean, like_count integer)
language sql security definer set search_path = ''
as $$
  select * from private.set_relation('combo_likes', 'combos', 'combo_id', 'like_count', p_combo_id, p_liked);
$$;

-- 4. 입구: 북마크 ---------------------------------------------------------------

create function public.set_recipe_bookmark(p_recipe_id uuid, p_bookmarked boolean)
returns table (bookmarked boolean, bookmark_count integer)
language sql security definer set search_path = ''
as $$
  select * from private.set_relation('recipe_bookmarks', 'recipes', 'recipe_id', 'bookmark_count', p_recipe_id, p_bookmarked);
$$;

create function public.set_post_bookmark(p_post_id uuid, p_bookmarked boolean)
returns table (bookmarked boolean, bookmark_count integer)
language sql security definer set search_path = ''
as $$
  select * from private.set_relation('post_bookmarks', 'posts', 'post_id', 'bookmark_count', p_post_id, p_bookmarked);
$$;

create function public.set_combo_bookmark(p_combo_id uuid, p_bookmarked boolean)
returns table (bookmarked boolean, bookmark_count integer)
language sql security definer set search_path = ''
as $$
  select * from private.set_relation('combo_bookmarks', 'combos', 'combo_id', 'bookmark_count', p_combo_id, p_bookmarked);
$$;

-- 5. 입구: 팔로우 ---------------------------------------------------------------
-- 자기 자신 팔로우 금지와 양쪽 카운터 반환이 달라 공통 로직과 분리하되, 방식은 같게 맞춘다.

create function public.set_follow(p_target_id uuid, p_following boolean)
returns table (following boolean, follower_count integer, following_count integer)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;
  if p_following is null then
    raise exception 'STATE_REQUIRED' using errcode = '22004';
  end if;
  if v_user_id = p_target_id then
    raise exception 'CANNOT_FOLLOW_SELF' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_target_id) then
    return;
  end if;

  if p_following then
    insert into public.user_follows (follower_id, following_id)
    values (v_user_id, p_target_id)
    on conflict do nothing;
  else
    delete from public.user_follows
    where follower_id = v_user_id and following_id = p_target_id;
  end if;

  return query
  select
    p_following,
    (select target.follower_count from public.profiles target where target.id = p_target_id),
    (select self.following_count from public.profiles self where self.id = v_user_id);
end;
$$;

-- 6. 실행 권한: 입구 7개는 로그인 사용자만 ------------------------------------

revoke all on function
  public.set_recipe_like(uuid, boolean),
  public.set_post_like(uuid, boolean),
  public.set_combo_like(uuid, boolean),
  public.set_recipe_bookmark(uuid, boolean),
  public.set_post_bookmark(uuid, boolean),
  public.set_combo_bookmark(uuid, boolean),
  public.set_follow(uuid, boolean)
from public, anon;

grant execute on function
  public.set_recipe_like(uuid, boolean),
  public.set_post_like(uuid, boolean),
  public.set_combo_like(uuid, boolean),
  public.set_recipe_bookmark(uuid, boolean),
  public.set_post_bookmark(uuid, boolean),
  public.set_combo_bookmark(uuid, boolean),
  public.set_follow(uuid, boolean)
to authenticated;

-- 7. 옛 토글 RPC 삭제 -------------------------------------------------------------

drop function public.recipe_toggle_like(uuid);
drop function public.post_toggle_like(uuid);
drop function public.combo_toggle_like(uuid);
drop function public.toggle_bookmark(text, uuid);
drop function public.toggle_follow(uuid);

-- 8. 쓰이지 않는 쓰기 정책 삭제 ---------------------------------------------------
-- 로그인 사용자에게는 관계 테이블의 SELECT 권한만 있고 쓰기는 위 RPC로만 한다.
-- INSERT·DELETE 권한이 없어 한 번도 적용되지 않던 정책이다.

drop policy recipe_likes_insert_own on public.recipe_likes;
drop policy recipe_likes_delete_own on public.recipe_likes;
drop policy post_likes_insert_own on public.post_likes;
drop policy post_likes_delete_own on public.post_likes;
drop policy combo_likes_insert_own on public.combo_likes;
drop policy combo_likes_delete_own on public.combo_likes;
drop policy recipe_bookmarks_insert_own on public.recipe_bookmarks;
drop policy recipe_bookmarks_delete_own on public.recipe_bookmarks;
drop policy post_bookmarks_insert_own on public.post_bookmarks;
drop policy post_bookmarks_delete_own on public.post_bookmarks;
drop policy combo_bookmarks_insert_own on public.combo_bookmarks;
drop policy combo_bookmarks_delete_own on public.combo_bookmarks;
drop policy user_follows_insert_own on public.user_follows;
drop policy user_follows_delete_own on public.user_follows;
