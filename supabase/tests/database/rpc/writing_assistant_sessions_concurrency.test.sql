-- 같은 사용자가 "작성 도우미 시작하기"를 동시에 눌러도 하루 상한을 넘지 않는지, 실제로 겨루는 두 연결로 확인한다.
-- 한 연결 안에서는 동시 실행을 만들 수 없어 dblink로 같은 DB에 연결을 더 연다.
--
-- 실행 조건
-- - TCP로 접속해 실행한다(supabase test db처럼). 서버 주소(inet_server_addr)로 다시 접속하기 때문이다.
-- - 다시 접속할 때 로컬 Supabase 기본 계정(postgres/postgres)을 쓴다. 로컬·격리 테스트 DB에서만 통과한다.
-- - 다른 연결에서 커밋한 행은 이 파일의 rollback으로 지워지지 않는다. 실행마다 새 사용자를 만들고 끝에서 지우며,
--   전에 실패해 남은 테스트 사용자도 시작할 때 지운다.
begin;

create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;

select extensions.plan(5);

create temporary table race as
select
  gen_random_uuid() as user_id,
  format(
    'host=%s user=postgres password=postgres dbname=%s',
    host(inet_server_addr()),
    current_database()
  ) as conn;

select extensions.ok(
  inet_server_addr() is not null,
  'TCP로 접속해 실행한다(다른 연결을 같은 서버 주소로 연다)'
);

-- 준비: 다른 연결에서 사용자와 오늘 시작한 대화 1개를 커밋한다. 하루 상한 2 중 1번이 남는다.
select extensions.dblink_connect('setup', (select conn from race));
select extensions.dblink_exec(
  'setup',
  $$delete from auth.users where email like 'writing-race-%@foodcafe.invalid'$$
);
select extensions.dblink_exec(
  'setup',
  format(
    $$insert into auth.users (
      id, aud, role, email, encrypted_password,
      raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at
    )
    values (%L, 'authenticated', 'authenticated', %L, '', '{}', '{}', now(), now(), now())$$,
    user_id,
    'writing-race-' || user_id || '@foodcafe.invalid'
  )
)
from race;
select *
from extensions.dblink(
  'setup',
  format('select * from public.start_writing_assistant_session(%L, 2)', (select user_id from race))
) as t(session_id uuid, remaining integer);

-- 첫 연결이 마지막 1번을 시작하고, 커밋하지 않은 채 잠금을 쥐고 있다.
select extensions.dblink_connect('first', (select conn from race));
select extensions.dblink_connect('second', (select conn from race));
select extensions.dblink_exec('first', 'begin');

select extensions.is(
  (
    select row(started, remaining)::text
    from extensions.dblink(
      'first',
      format(
        'select session_id is not null, remaining from public.start_writing_assistant_session(%L, 2)',
        (select user_id from race)
      )
    ) as t(started boolean, remaining integer)
  ),
  row(true, 0)::text,
  '첫 연결은 마지막 남은 1번으로 대화를 시작한다'
);

-- 두 번째 연결이 같은 사용자의 시작을 보낸다. 첫 연결이 끝날 때까지 기다려야 한다.
-- 잠금이 없다면 첫 연결의 아직 커밋 안 된 행이 보이지 않아 바로 시작해 버린다.
select extensions.dblink_send_query(
  'second',
  format(
    'select session_id is not null, remaining from public.start_writing_assistant_session(%L, 2)',
    (select user_id from race)
  )
);
select pg_sleep(0.5);

select extensions.ok(
  extensions.dblink_is_busy('second') = 1,
  '두 번째 시작은 첫 시작이 끝날 때까지 기다린다'
);

select extensions.dblink_exec('first', 'commit');

create temporary table second_result as
select *
from extensions.dblink_get_result('second') as t(started boolean, remaining integer);
-- 보낸 질의의 끝을 읽어 연결을 비운다.
select * from extensions.dblink_get_result('second') as t(started boolean, remaining integer);

select extensions.is(
  (select row(started, remaining)::text from second_result),
  row(false, 0)::text,
  '첫 시작이 커밋된 뒤 두 번째 시작은 상한에 걸려 대화를 만들지 않는다'
);

select extensions.is(
  public.count_writing_assistant_sessions_today((select user_id from race)),
  2,
  '동시에 눌러도 오늘 시작한 대화는 상한 2를 넘지 않는다'
);

-- 정리: 다른 연결에서 커밋한 사용자를 지운다. 사용 기록은 사용자와 함께 지워진다.
select extensions.dblink_exec(
  'setup',
  format('delete from auth.users where id = %L', user_id)
)
from race;
select extensions.dblink_disconnect('first');
select extensions.dblink_disconnect('second');
select extensions.dblink_disconnect('setup');

select * from extensions.finish();
rollback;
