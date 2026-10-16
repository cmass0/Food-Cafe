-- AI 작성 도우미 사용 기록. 사용자는 한국 날짜 하루에 정해진 횟수만 도우미를 시작할 수 있고,
-- 시작한 대화(세션)마다 AI 호출 수에도 상한이 있다. 세기와 막기는 아래 서버 전용 RPC 안에서 처리해
-- 브라우저가 보낸 값(질문 횟수 등)을 바꿔도 상한을 넘지 못한다.
create table private.writing_assistant_sessions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  started_on date not null,
  call_count integer not null default 0,
  created_at timestamp with time zone not null default now(),

  constraint writing_assistant_sessions_pkey
    primary key (id),
  constraint writing_assistant_sessions_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint writing_assistant_sessions_call_count_check
    check (call_count >= 0)
);

create index writing_assistant_sessions_user_day_idx
  on private.writing_assistant_sessions (user_id, started_on);

comment on table private.writing_assistant_sessions is
  'AI 작성 도우미 대화 1개 = 1행. 하루 시작 횟수와 대화별 AI 호출 수 상한을 서버 전용 RPC로 센다.';
comment on column private.writing_assistant_sessions.started_on is
  '대화를 시작한 Asia/Seoul 기준 날짜. 하루 시작 횟수는 이 날짜로 센다.';
comment on column private.writing_assistant_sessions.call_count is
  '이 대화에서 AI를 부른 횟수. 서버·AI 오류로 실패한 호출은 되돌린다.';

alter table private.writing_assistant_sessions enable row level security;

-- 브라우저 역할은 물론 service_role도 표를 직접 읽거나 쓰지 않고 아래 RPC로만 다룬다.
revoke all on table private.writing_assistant_sessions
  from public, anon, authenticated, service_role;

-- 오늘(한국 날짜) 시작한 대화 수. 화면에 남은 횟수를 보여줄 때 쓴다.
create or replace function public.count_writing_assistant_sessions_today(
  p_user_id uuid
)
returns integer
language sql
stable
security definer
set search_path to ''
as $function$
  select count(*)::integer
  from private.writing_assistant_sessions
  where user_id = p_user_id
    and started_on = (now() at time zone 'Asia/Seoul')::date;
$function$;

-- 오늘 시작한 대화가 상한(p_max_sessions)보다 적으면 새 대화를 만들고, 그 대화 ID와 오늘 남은 시작 횟수를
-- 한 행으로 돌려준다. 상한이면 대화 ID는 null, 남은 횟수는 0이다. 시작과 남은 횟수를 한 번에 돌려줘서,
-- 시작한 뒤 따로 세다가 실패해 하루 사용만 줄고 대화 ID를 잃는 일이 없게 한다.
-- 같은 사용자의 동시 요청은 advisory lock으로 하나씩 처리해 상한을 넘지 않는다.
create or replace function public.start_writing_assistant_session(
  p_user_id uuid,
  p_max_sessions integer
)
returns table (session_id uuid, remaining integer)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_started integer;
  v_session_id uuid;
begin
  if p_user_id is null or p_max_sessions is null or p_max_sessions < 1 then
    raise exception '작성 도우미 사용 조건이 올바르지 않습니다.'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('writing_assistant_session:' || p_user_id::text, 0)
  );

  select count(*)::integer
  into v_started
  from private.writing_assistant_sessions as s
  where s.user_id = p_user_id
    and s.started_on = v_today;

  if v_started >= p_max_sessions then
    return query select null::uuid, 0;
    return;
  end if;

  insert into private.writing_assistant_sessions (user_id, started_on)
  values (p_user_id, v_today)
  returning id into v_session_id;

  return query select v_session_id, p_max_sessions - v_started - 1;
end;
$function$;

-- 대화에서 AI를 한 번 더 부를 수 있으면 호출 수를 1 올려 새 값을, 아니면 null을 돌려준다.
-- 다른 사용자의 대화 ID도 null이다. 조건부 UPDATE 한 문장이라 동시 요청에도 상한을 넘지 않는다.
create or replace function public.use_writing_assistant_call(
  p_session_id uuid,
  p_user_id uuid,
  p_max_calls integer
)
returns integer
language sql
security definer
set search_path to ''
as $function$
  update private.writing_assistant_sessions
  set call_count = call_count + 1
  where id = p_session_id
    and user_id = p_user_id
    and call_count < p_max_calls
  returning call_count;
$function$;

-- 서버·AI 오류로 실패한 호출을 되돌린다. 0 아래로는 내리지 않는다.
create or replace function public.refund_writing_assistant_call(
  p_session_id uuid,
  p_user_id uuid
)
returns void
language sql
security definer
set search_path to ''
as $function$
  update private.writing_assistant_sessions
  set call_count = call_count - 1
  where id = p_session_id
    and user_id = p_user_id
    and call_count > 0;
$function$;

-- 사용자 ID를 인자로 받으므로 브라우저 역할이 부르면 남의 사용 횟수를 바꿀 수 있다. 서버만 실행한다.
revoke all on function public.count_writing_assistant_sessions_today(uuid)
  from public, anon, authenticated;
revoke all on function public.start_writing_assistant_session(uuid, integer)
  from public, anon, authenticated;
revoke all on function public.use_writing_assistant_call(uuid, uuid, integer)
  from public, anon, authenticated;
revoke all on function public.refund_writing_assistant_call(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.count_writing_assistant_sessions_today(uuid) to service_role;
grant execute on function public.start_writing_assistant_session(uuid, integer) to service_role;
grant execute on function public.use_writing_assistant_call(uuid, uuid, integer) to service_role;
grant execute on function public.refund_writing_assistant_call(uuid, uuid) to service_role;
