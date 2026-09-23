-- 댓글 부모를 parent_type/parent_id 다형 참조에서 부모별 FK 컬럼(배타적 연관)으로 바꾼다.
-- 부모 삭제 시 댓글을 FK CASCADE로 정리하고, 존재하지 않는 부모에 댓글이 생기는 것도 DB가 막는다.

-- 1. 부모가 이미 삭제된 고아 댓글은 FK를 걸 수 없으므로 먼저 정리한다.
delete from public.comments as comment
where (comment.parent_type = 'post' and not exists (select 1 from public.posts as parent where parent.id = comment.parent_id))
   or (comment.parent_type = 'recipe' and not exists (select 1 from public.recipes as parent where parent.id = comment.parent_id))
   or (comment.parent_type = 'combo' and not exists (select 1 from public.combos as parent where parent.id = comment.parent_id));

-- 2. 부모별 컬럼을 추가하고 기존 값을 옮긴다. 이관이 댓글 수정 시각을 바꾸지 않게 updated_at Trigger를 잠시 끈다.
alter table public.comments
  add column post_id uuid,
  add column recipe_id uuid,
  add column combo_id uuid;

alter table public.comments disable trigger trg_comments_updated;

update public.comments
set
  post_id = case when parent_type = 'post' then parent_id end,
  recipe_id = case when parent_type = 'recipe' then parent_id end,
  combo_id = case when parent_type = 'combo' then parent_id end;

alter table public.comments enable trigger trg_comments_updated;

-- 3. 부모별 FK CASCADE와 "부모는 정확히 하나" 제약을 건다.
alter table public.comments
  add constraint comments_post_id_fkey
    foreign key (post_id) references public.posts(id) on delete cascade,
  add constraint comments_recipe_id_fkey
    foreign key (recipe_id) references public.recipes(id) on delete cascade,
  add constraint comments_combo_id_fkey
    foreign key (combo_id) references public.combos(id) on delete cascade,
  add constraint comments_exactly_one_parent_check
    check (num_nonnulls(post_id, recipe_id, combo_id) = 1);

-- 부모별 목록 조회(최신순)와 FK CASCADE 삭제에 사용한다.
create index idx_comments_post_created_at
  on public.comments (post_id, created_at desc) where post_id is not null;
create index idx_comments_recipe_created_at
  on public.comments (recipe_id, created_at desc) where recipe_id is not null;
create index idx_comments_combo_created_at
  on public.comments (combo_id, created_at desc) where combo_id is not null;

-- 기간별 트렌딩 집계에서 최근 활성 댓글만 읽는 데 사용한다.
create index idx_comments_post_recent_trending
  on public.comments (created_at desc, post_id, writer_uid)
  where post_id is not null and deleted_at is null;
create index idx_comments_recipe_recent_trending
  on public.comments (created_at desc, recipe_id, writer_uid)
  where recipe_id is not null and deleted_at is null;
create index idx_comments_combo_recent_trending
  on public.comments (created_at desc, combo_id, writer_uid)
  where combo_id is not null and deleted_at is null;

-- 4. 댓글 수 Trigger를 새 컬럼 기준 하나의 함수로 합친다.
-- 댓글 작성자는 부모 글의 작성자가 아닐 수 있으므로, 부모 UPDATE RLS를 우회하는 SECURITY DEFINER로 실행한다.
create or replace function private.sync_comment_parent_count()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_post_id uuid;
  v_recipe_id uuid;
  v_combo_id uuid;
  v_delta integer := 0;
begin
  if tg_op = 'INSERT' then
    v_post_id := new.post_id;
    v_recipe_id := new.recipe_id;
    v_combo_id := new.combo_id;
    if new.deleted_at is null then
      v_delta := 1;
    end if;
  elsif tg_op = 'DELETE' then
    v_post_id := old.post_id;
    v_recipe_id := old.recipe_id;
    v_combo_id := old.combo_id;
    if old.deleted_at is null then
      v_delta := -1;
    end if;
  elsif tg_op = 'UPDATE' then
    v_post_id := old.post_id;
    v_recipe_id := old.recipe_id;
    v_combo_id := old.combo_id;
    if old.deleted_at is null and new.deleted_at is not null then
      v_delta := -1;
    elsif old.deleted_at is not null and new.deleted_at is null then
      v_delta := 1;
    end if;
  end if;

  -- 부모가 CASCADE로 먼저 삭제된 경우 UPDATE 대상이 없어 아무것도 바뀌지 않는다.
  if v_delta <> 0 then
    if v_post_id is not null then
      update public.posts
      set comment_count = greatest(coalesce(comment_count, 0) + v_delta, 0)
      where id = v_post_id;
    elsif v_recipe_id is not null then
      update public.recipes
      set comment_count = greatest(coalesce(comment_count, 0) + v_delta, 0)
      where id = v_recipe_id;
    elsif v_combo_id is not null then
      update public.combos
      set comment_count = greatest(coalesce(comment_count, 0) + v_delta, 0)
      where id = v_combo_id;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

revoke all on function private.sync_comment_parent_count()
  from public, anon, authenticated, service_role;

drop trigger trg_comments_after_insert on public.comments;
drop trigger trg_comments_after_delete on public.comments;
drop trigger trg_comments_after_update on public.comments;

create trigger trg_comments_after_insert
after insert on public.comments
for each row execute function private.sync_comment_parent_count();

create trigger trg_comments_after_delete
after delete on public.comments
for each row execute function private.sync_comment_parent_count();

create trigger trg_comments_after_update
after update of deleted_at on public.comments
for each row execute function private.sync_comment_parent_count();

-- 기존 댓글 수 함수와 연결되지 않은 게시글 전용 레거시 함수를 제거한다.
drop function public.bump_comment_count();
drop function public.drop_comment_count();
drop function public.sync_comment_count_on_update();
drop function public.bump_post_comment_count();
drop function public.drop_post_comment_count();
drop function public.sync_post_comment_count_on_update();

-- 5. 기간별 트렌딩 RPC의 댓글 조건을 새 컬럼으로 바꾼다. 나머지 계산은 기존과 같다.
create or replace function private.get_trending_combos_by_period(p_period text default 'week'::text, p_limit_size integer default 10)
returns table(id uuid, title text, summary text, image text, tags text[], like_count integer, bookmark_count integer, comment_count integer, view_count integer, created_at timestamp with time zone, writer_uid uuid, writer_name text, recent_like_count bigint, recent_bookmark_count bigint, recent_comment_count bigint, recent_participant_count bigint, recent_activity_count bigint, trend_score bigint, last_activity_at timestamp with time zone)
language sql
stable security definer
set search_path to ''
as $function$
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
      c.combo_id,
      c.writer_uid,
      'comment'::text,
      c.created_at
    from public.comments c
    where c.combo_id is not null
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

create or replace function private.get_trending_posts_by_period(p_period text default 'week'::text, p_limit_size integer default 10)
returns table(id uuid, title text, summary text, image text, tags text[], like_count integer, bookmark_count integer, comment_count integer, view_count integer, created_at timestamp with time zone, writer_uid uuid, writer_name text, recent_like_count bigint, recent_bookmark_count bigint, recent_comment_count bigint, recent_participant_count bigint, recent_activity_count bigint, trend_score bigint, last_activity_at timestamp with time zone)
language sql
stable security definer
set search_path to ''
as $function$
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
      c.post_id,
      c.writer_uid,
      'comment'::text,
      c.created_at
    from public.comments c
    where c.post_id is not null
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

create or replace function private.get_trending_recipe_tags_by_period(p_period text default 'week'::text, p_limit_size integer default 10)
returns table(tag text, recent_recipe_count bigint, total_recipe_count bigint, recent_like_count bigint, recent_bookmark_count bigint, recent_comment_count bigint, recent_participant_count bigint, recent_activity_count bigint, trend_score bigint, last_activity_at timestamp with time zone)
language sql
stable security definer
set search_path to ''
as $function$
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
      c.recipe_id,
      c.writer_uid,
      'comment'::text,
      c.created_at
    from public.comments c
    where c.recipe_id is not null
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

create or replace function private.get_trending_recipes_by_period(p_period text default 'week'::text, p_limit_size integer default 10)
returns table(id uuid, title text, summary text, image text, tags text[], like_count integer, bookmark_count integer, comment_count integer, view_count integer, created_at timestamp with time zone, writer_uid uuid, writer_name text, recent_like_count bigint, recent_bookmark_count bigint, recent_comment_count bigint, recent_participant_count bigint, recent_activity_count bigint, trend_score bigint, last_activity_at timestamp with time zone)
language sql
stable security definer
set search_path to ''
as $function$
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
      c.recipe_id,
      c.writer_uid,
      'comment'::text,
      c.created_at
    from public.comments c
    where c.recipe_id is not null
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

-- 6. 옛 다형 참조 컬럼과 enum을 제거한다. 옛 인덱스는 컬럼과 함께 삭제된다.
alter table public.comments
  drop column parent_type,
  drop column parent_id;

drop type public.comment_parent_type;

-- 7. 이전 Trigger 권한 문제로 어긋난 부모 댓글 수를 실제 활성 댓글 수로 다시 맞춘다.
update public.posts as parent
set comment_count = counted.total
from (
  select post.id, count(comment.id)::integer as total
  from public.posts as post
  left join public.comments as comment
    on comment.post_id = post.id and comment.deleted_at is null
  group by post.id
) as counted
where counted.id = parent.id
  and parent.comment_count is distinct from counted.total;

update public.recipes as parent
set comment_count = counted.total
from (
  select recipe.id, count(comment.id)::integer as total
  from public.recipes as recipe
  left join public.comments as comment
    on comment.recipe_id = recipe.id and comment.deleted_at is null
  group by recipe.id
) as counted
where counted.id = parent.id
  and parent.comment_count is distinct from counted.total;

update public.combos as parent
set comment_count = counted.total
from (
  select combo.id, count(comment.id)::integer as total
  from public.combos as combo
  left join public.comments as comment
    on comment.combo_id = combo.id and comment.deleted_at is null
  group by combo.id
) as counted
where counted.id = parent.id
  and parent.comment_count is distinct from counted.total;
