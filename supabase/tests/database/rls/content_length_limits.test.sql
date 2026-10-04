begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(10);

-- 규칙: 로그인 사용자가 앱 서버를 거치지 않고 Supabase API로 직접 써도 앱과 같은 길이·크기 상한에서 막힌다.
-- 로컬 테스트 DB에서만 실행한다. 모든 변경은 끝에서 롤백한다.

insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values (
  '97000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'limit-writer@test.local',
  '{"display_name":"길이 검사 작성자"}', now(), now()
);

select set_config(
  'request.jwt.claims',
  '{"sub":"97000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select extensions.lives_ok(
  $$
    insert into public.posts (id, title, category, content_json, content_html, content_text, writer_uid)
    values (
      '97000000-0000-4000-8000-000000000011', repeat('가', 150), 'free', '{"root":{"children":[]}}',
      '<p>본문</p>', '본문', '97000000-0000-4000-8000-000000000001'
    )
  $$,
  '게시글 제목 150자는 저장할 수 있다'
);

select extensions.throws_ok(
  $$
    insert into public.posts (title, category, content_json, content_html, content_text, writer_uid)
    values (
      repeat('가', 151), 'free', '{"root":{"children":[]}}', '<p>본문</p>', '본문',
      '97000000-0000-4000-8000-000000000001'
    )
  $$,
  '23514',
  null,
  '게시글 제목 151자는 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.posts (title, category, content_json, content_html, content_text, writer_uid)
    values (
      '큰 본문', 'free', '{"root":{"children":[]}}', repeat('가', 300001), '본문',
      '97000000-0000-4000-8000-000000000001'
    )
  $$,
  '23514',
  null,
  '본문 HTML이 30만 자를 넘으면 거절한다'
);

select extensions.throws_ok(
  $$
    update public.posts set content_html = repeat('가', 300001)
    where id = '97000000-0000-4000-8000-000000000011'
  $$,
  '23514',
  null,
  '자기 글이어도 본문 HTML을 상한 넘게 바꿀 수 없다'
);

select extensions.is(
  (select content_html from public.posts where id = '97000000-0000-4000-8000-000000000011'),
  '<p>본문</p>',
  '거절된 수정은 저장된 본문을 바꾸지 않는다'
);

select extensions.lives_ok(
  $$
    insert into public.comments (post_id, content)
    values ('97000000-0000-4000-8000-000000000011', repeat('가', 1000))
  $$,
  '댓글 1000자는 저장할 수 있다'
);

select extensions.throws_ok(
  $$
    insert into public.comments (post_id, content)
    values ('97000000-0000-4000-8000-000000000011', repeat('가', 1001))
  $$,
  '23514',
  null,
  '댓글 1001자는 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.recipes (title, steps, image, writer_uid)
    values (repeat('가', 201), '[]', 'test-image', '97000000-0000-4000-8000-000000000001')
  $$,
  '23514',
  null,
  '레시피 제목 201자는 거절한다'
);

select extensions.throws_ok(
  $$
    insert into public.combos (title, summary, writer_uid)
    values ('조합', repeat('가', 501), '97000000-0000-4000-8000-000000000001')
  $$,
  '23514',
  null,
  '조합 요약 501자는 거절한다'
);

reset role;

select extensions.is(
  (
    select count(*)::integer from public.comments
    where post_id = '97000000-0000-4000-8000-000000000011'
  ),
  1,
  '거절된 댓글은 남지 않고 허용된 댓글만 저장된다'
);

select * from extensions.finish();

rollback;
