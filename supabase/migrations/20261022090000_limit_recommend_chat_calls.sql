-- AI 추천 채팅 사용 기록. 질문 1개 = AI 호출 1번이며, 한국 날짜 하루에 정해진 횟수까지만 받는다.
-- 로그인 사용자는 사용자 ID로, 비로그인 사용자는 서버가 IP를 해시한 값으로 센다.
-- 세기와 막기는 아래 서버 전용 RPC 한 문장 안에서 처리해 동시 요청에도 상한을 넘지 않는다.
create table private.recommend_chat_usage (
  subject text not null,
  used_on date not null,
  call_count integer not null default 0,

  constraint recommend_chat_usage_pkey
    primary key (subject, used_on),
  constraint recommend_chat_usage_subject_check
    check (subject ~ '^(user|ip):' and char_length(subject) <= 100),
  constraint recommend_chat_usage_call_count_check
    check (call_count >= 0)
);

comment on table private.recommend_chat_usage is
  'AI 추천 채팅의 하루 사용 횟수. 사용 주체·한국 날짜마다 1행이며 서버 전용 RPC로만 센다.';
comment on column private.recommend_chat_usage.subject is
  '사용 주체. 로그인 사용자는 user:<사용자 ID>, 비로그인은 ip:<IP의 HMAC>. 원래 IP는 저장하지 않는다.';
comment on column private.recommend_chat_usage.used_on is
  'Asia/Seoul 기준 사용 날짜. 날짜가 바뀌면 새 행으로 다시 센다.';
comment on column private.recommend_chat_usage.call_count is
  '그날 AI 추천에 보낸 질문 수.';

alter table private.recommend_chat_usage enable row level security;

-- 브라우저 역할은 물론 service_role도 표를 직접 읽거나 쓰지 않고 아래 RPC로만 다룬다.
revoke all on table private.recommend_chat_usage
  from public, anon, authenticated, service_role;

-- 오늘 상한(p_max_calls)보다 적게 썼으면 1을 더하고 오늘 남은 횟수를, 상한이면 null을 돌려준다.
-- INSERT ... ON CONFLICT 한 문장이라 같은 주체의 동시 요청도 행 잠금으로 하나씩 처리된다.
create or replace function public.use_recommend_chat_call(
  p_subject text,
  p_max_calls integer
)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_count integer;
begin
  if p_subject is null or p_max_calls is null or p_max_calls < 1 then
    raise exception 'AI 추천 사용 조건이 올바르지 않습니다.'
      using errcode = '22023';
  end if;

  insert into private.recommend_chat_usage as u (subject, used_on, call_count)
  values (p_subject, (now() at time zone 'Asia/Seoul')::date, 1)
  on conflict (subject, used_on) do update
    set call_count = u.call_count + 1
    where u.call_count < p_max_calls
  returning u.call_count into v_count;

  if v_count is null then
    return null;
  end if;

  return p_max_calls - v_count;
end;
$function$;

-- 사용 주체를 인자로 받으므로 브라우저 역할이 부르면 남의 횟수를 바꿀 수 있다. 서버만 실행한다.
revoke all on function public.use_recommend_chat_call(text, integer)
  from public, anon, authenticated;

grant execute on function public.use_recommend_chat_call(text, integer) to service_role;
