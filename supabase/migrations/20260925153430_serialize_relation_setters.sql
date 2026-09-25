-- 같은 사용자가 같은 대상에 보낸 관계 지정 요청(좋아요·북마크·팔로우)을 차례로 처리한다.
--
-- 문제: "켜기"의 INSERT가 확정되기 전에 "끄기"의 DELETE가 실행되면, DELETE는 아직 보이지 않는 행을
--       지나쳐 0행을 지운다. 이후 INSERT가 확정되어 마지막 요청(끄기)과 다른 상태(켜짐)로 남는다.
-- 해결: 함수 첫 단계에서 "사용자 + 대상" 조합마다 트랜잭션 잠금(advisory lock)을 잡는다.
--       같은 조합의 요청만 앞 요청이 끝날 때까지 기다리고, 다른 사용자·다른 대상은 서로 기다리지 않는다.
--       잠금은 트랜잭션이 끝나면(성공·실패 모두) 자동으로 풀린다.
-- CREATE OR REPLACE는 함수 oid·실행 권한·설명을 유지한다.

create or replace function private.set_relation(
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

  -- 같은 사용자·관계·대상 요청을 차례로 처리한다.
  perform pg_advisory_xact_lock(
    hashtextextended(format('relation:%s:%s:%s', p_relation, v_user_id, p_parent_id), 0)
  );

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

create or replace function public.set_follow(p_target_id uuid, p_following boolean)
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

  -- 같은 사용자·대상 팔로우 요청을 차례로 처리한다.
  perform pg_advisory_xact_lock(
    hashtextextended(format('follow:%s:%s', v_user_id, p_target_id), 0)
  );

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
