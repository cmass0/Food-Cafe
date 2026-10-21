begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(11);

-- 권한: 사용 주체를 인자로 받는 RPC라 브라우저 역할이 부르면 남의 횟수를 바꿀 수 있다. 서버만 실행한다.
select extensions.ok(
  not has_function_privilege('anon', 'public.use_recommend_chat_call(text, integer)', 'execute')
  and not has_function_privilege('authenticated', 'public.use_recommend_chat_call(text, integer)', 'execute'),
  'anon과 authenticated는 AI 추천 사용 RPC를 실행할 수 없다'
);

select extensions.ok(
  has_function_privilege('service_role', 'public.use_recommend_chat_call(text, integer)', 'execute'),
  'service_role은 AI 추천 사용 RPC를 실행할 수 있다'
);

select extensions.ok(
  not has_table_privilege('anon', 'private.recommend_chat_usage', 'select, insert, update, delete')
  and not has_table_privilege('authenticated', 'private.recommend_chat_usage', 'select, insert, update, delete')
  and not has_table_privilege('service_role', 'private.recommend_chat_usage', 'select, insert, update, delete'),
  '사용 기록 표는 어떤 역할도 직접 읽거나 쓰지 못하고 RPC로만 다룬다'
);

-- 어제 상한까지 쓴 기록은 오늘 횟수에 세지 않아야 한다.
insert into private.recommend_chat_usage (subject, used_on, call_count)
values ('user:test-a', (now() at time zone 'Asia/Seoul')::date - 1, 3);

create temporary table calls (n integer primary key, remaining integer);

insert into calls values (1, public.use_recommend_chat_call('user:test-a', 3));
insert into calls values (2, public.use_recommend_chat_call('user:test-a', 3));
insert into calls values (3, public.use_recommend_chat_call('user:test-a', 3));
insert into calls values (4, public.use_recommend_chat_call('user:test-a', 3));
insert into calls values (5, public.use_recommend_chat_call('user:test-a', 3));

select extensions.is(
  (select array_agg(remaining order by n) from calls where n <= 3),
  array[2, 1, 0],
  '상한 3 안에서는 쓸 때마다 오늘 남은 횟수를 돌려준다'
);

select extensions.ok(
  (select remaining from calls where n = 4) is null
  and (select remaining from calls where n = 5) is null,
  '상한을 넘은 요청은 null이다'
);

select extensions.is(
  (
    select call_count from private.recommend_chat_usage
    where subject = 'user:test-a' and used_on = (now() at time zone 'Asia/Seoul')::date
  ),
  3,
  '거절된 요청은 오늘 횟수를 늘리지 않는다'
);

select extensions.is(
  (
    select call_count from private.recommend_chat_usage
    where subject = 'user:test-a' and used_on = (now() at time zone 'Asia/Seoul')::date - 1
  ),
  3,
  '어제 기록은 바뀌지 않는다'
);

select extensions.is(
  public.use_recommend_chat_call('ip:test-b', 3),
  2,
  '다른 사용 주체는 따로 센다'
);

select extensions.is(
  public.use_recommend_chat_call('ip:test-c', 1),
  0,
  '상한 1이면 첫 요청에 남은 횟수 0을 돌려준다'
);

select extensions.throws_ok(
  $$ select public.use_recommend_chat_call('user:test-d', 0) $$,
  '22023',
  'AI 추천 사용 조건이 올바르지 않습니다.',
  '상한이 1보다 작으면 거절한다'
);

select extensions.throws_ok(
  $$ select public.use_recommend_chat_call('guest:test-e', 3) $$,
  '23514',
  null,
  'user: 또는 ip:로 시작하지 않는 사용 주체는 저장하지 않는다'
);

select * from extensions.finish();

rollback;
