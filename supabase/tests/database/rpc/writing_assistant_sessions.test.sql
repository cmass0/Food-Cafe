begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(17);

-- 권한: 사용자 ID를 인자로 받는 RPC라 브라우저 역할이 부르면 남의 사용 횟수를 바꿀 수 있다. 서버만 실행한다.
select extensions.ok(
  not has_function_privilege('anon', 'public.count_writing_assistant_sessions_today(uuid)', 'execute')
  and not has_function_privilege('anon', 'public.start_writing_assistant_session(uuid, integer)', 'execute')
  and not has_function_privilege('anon', 'public.use_writing_assistant_call(uuid, uuid, integer)', 'execute')
  and not has_function_privilege('anon', 'public.refund_writing_assistant_call(uuid, uuid)', 'execute'),
  'anon은 작성 도우미 사용 RPC를 실행할 수 없다'
);

select extensions.ok(
  not has_function_privilege('authenticated', 'public.count_writing_assistant_sessions_today(uuid)', 'execute')
  and not has_function_privilege('authenticated', 'public.start_writing_assistant_session(uuid, integer)', 'execute')
  and not has_function_privilege('authenticated', 'public.use_writing_assistant_call(uuid, uuid, integer)', 'execute')
  and not has_function_privilege('authenticated', 'public.refund_writing_assistant_call(uuid, uuid)', 'execute'),
  'authenticated는 작성 도우미 사용 RPC를 실행할 수 없다'
);

select extensions.ok(
  has_function_privilege('service_role', 'public.count_writing_assistant_sessions_today(uuid)', 'execute')
  and has_function_privilege('service_role', 'public.start_writing_assistant_session(uuid, integer)', 'execute')
  and has_function_privilege('service_role', 'public.use_writing_assistant_call(uuid, uuid, integer)', 'execute')
  and has_function_privilege('service_role', 'public.refund_writing_assistant_call(uuid, uuid)', 'execute'),
  'service_role은 작성 도우미 사용 RPC 네 개를 실행할 수 있다'
);

select extensions.ok(
  not has_table_privilege('anon', 'private.writing_assistant_sessions', 'select, insert, update, delete')
  and not has_table_privilege('authenticated', 'private.writing_assistant_sessions', 'select, insert, update, delete')
  and not has_table_privilege('service_role', 'private.writing_assistant_sessions', 'select, insert, update, delete'),
  '사용 기록 표는 어떤 역할도 직접 읽거나 쓰지 못하고 RPC로만 다룬다'
);

-- 동작 검증용 사용자입니다.
insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at
)
values
  (
    '15000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
    'writing-user-a@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"작성 도우미 사용자 A"}', now(), now(), now()
  ),
  (
    '15000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
    'writing-user-b@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"작성 도우미 사용자 B"}', now(), now(), now()
  );

-- 사용자 B는 어제 대화 하나를 시작했다. 오늘 횟수에는 세지 않아야 한다.
insert into private.writing_assistant_sessions (id, user_id, started_on, call_count)
values (
  '25000000-0000-4000-8000-000000000001',
  '15000000-0000-4000-8000-000000000002',
  (now() at time zone 'Asia/Seoul')::date - 1,
  0
);

create temporary table started (label text primary key, session_id uuid);

insert into started
values
  ('a1', public.start_writing_assistant_session('15000000-0000-4000-8000-000000000001', 2)),
  ('a2', public.start_writing_assistant_session('15000000-0000-4000-8000-000000000001', 2));

-- 하루 시작 횟수: 상한까지는 새 대화를 만들고, 넘으면 null이며 행도 늘지 않는다.
select extensions.ok(
  (select count(distinct session_id) from started where session_id is not null) = 2,
  '상한 2 안에서는 서로 다른 대화 두 개를 만든다'
);

select extensions.is(
  public.start_writing_assistant_session('15000000-0000-4000-8000-000000000001', 2),
  null::uuid,
  '같은 날 세 번째 시작은 null을 돌려준다'
);

select extensions.is(
  public.count_writing_assistant_sessions_today('15000000-0000-4000-8000-000000000001'),
  2,
  '거부된 시작은 사용 기록을 남기지 않아 오늘 횟수가 2에 머문다'
);

select extensions.ok(
  (
    select bool_and(started_on = (now() at time zone 'Asia/Seoul')::date)
    from private.writing_assistant_sessions
    where user_id = '15000000-0000-4000-8000-000000000001'
  ),
  '시작 날짜는 한국 시간 기준으로 저장한다'
);

-- 다른 사용자와 지난 날짜는 섞이지 않는다.
insert into started
values ('b1', public.start_writing_assistant_session('15000000-0000-4000-8000-000000000002', 2));

select extensions.is(
  public.count_writing_assistant_sessions_today('15000000-0000-4000-8000-000000000002'),
  1,
  '어제 시작한 대화는 오늘 횟수에 세지 않고, 다른 사용자의 횟수와도 섞이지 않는다'
);

select extensions.throws_ok(
  $$ select public.start_writing_assistant_session('15000000-0000-4000-8000-000000000001', 0) $$,
  '22023',
  '작성 도우미 사용 조건이 올바르지 않습니다.',
  '하루 상한이 1보다 작으면 거부한다'
);

-- 대화별 AI 호출 수: 상한까지 1씩 올리고, 넘으면 null이며 값도 그대로다.
select extensions.is(
  array[
    public.use_writing_assistant_call((select session_id from started where label = 'a1'), '15000000-0000-4000-8000-000000000001', 3),
    public.use_writing_assistant_call((select session_id from started where label = 'a1'), '15000000-0000-4000-8000-000000000001', 3),
    public.use_writing_assistant_call((select session_id from started where label = 'a1'), '15000000-0000-4000-8000-000000000001', 3)
  ],
  array[1, 2, 3],
  '대화당 상한까지는 호출할 때마다 1씩 올라간다'
);

select extensions.is(
  public.use_writing_assistant_call((select session_id from started where label = 'a1'), '15000000-0000-4000-8000-000000000001', 3),
  null::integer,
  '대화당 상한을 넘는 호출은 null을 돌려준다'
);

select extensions.is(
  public.use_writing_assistant_call((select session_id from started where label = 'a2'), '15000000-0000-4000-8000-000000000002', 3),
  null::integer,
  '다른 사용자의 대화 ID로는 호출할 수 없다'
);

select extensions.is(
  (
    select array_agg(call_count order by s.label)
    from started as s
    join private.writing_assistant_sessions as w on w.id = s.session_id
    where s.label in ('a1', 'a2')
  ),
  array[3, 0],
  '거부된 호출은 호출 수를 바꾸지 않는다'
);

-- 실패한 호출 되돌리기: 1씩 내리고 0 아래로는 내리지 않는다.
select public.refund_writing_assistant_call((select session_id from started where label = 'a1'), '15000000-0000-4000-8000-000000000001');
select public.refund_writing_assistant_call((select session_id from started where label = 'a2'), '15000000-0000-4000-8000-000000000001');
select public.refund_writing_assistant_call((select session_id from started where label = 'b1'), '15000000-0000-4000-8000-000000000001');

select extensions.is(
  (
    select array_agg(call_count order by s.label)
    from started as s
    join private.writing_assistant_sessions as w on w.id = s.session_id
  ),
  array[2, 0, 0],
  '되돌리기는 1 내리고, 0이거나 다른 사용자의 대화면 그대로 둔다'
);

-- 탈퇴한 사용자의 사용 기록은 함께 지운다.
delete from auth.users where id = '15000000-0000-4000-8000-000000000001';

select extensions.is(
  (
    select count(*)::integer
    from private.writing_assistant_sessions
    where user_id = '15000000-0000-4000-8000-000000000001'
  ),
  0,
  '사용자를 지우면 그 사용자의 사용 기록도 지워진다'
);

select extensions.is(
  public.count_writing_assistant_sessions_today('15000000-0000-4000-8000-000000000002'),
  1,
  '다른 사용자의 사용 기록은 남는다'
);

select * from extensions.finish();
rollback;
