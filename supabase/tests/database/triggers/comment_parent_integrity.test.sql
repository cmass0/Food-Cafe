begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(12);

-- 구조: 다형 참조 컬럼 대신 부모별 FK 컬럼만 남는다.
select extensions.is(
  (
    select array_agg(column_name::text order by column_name)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'comments'
      and column_name in ('parent_type', 'parent_id', 'post_id', 'recipe_id', 'combo_id')
  ),
  array['combo_id', 'post_id', 'recipe_id']::text[],
  '댓글은 parent_type/parent_id 대신 부모별 FK 컬럼을 사용한다'
);

select extensions.ok(
  not has_column_privilege('authenticated', 'public.comments', 'post_id', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.comments', 'recipe_id', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.comments', 'combo_id', 'UPDATE'),
  '로그인 사용자는 작성된 댓글의 부모를 바꿀 수 없다'
);

insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at
)
values
  (
    '13000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
    'comment-owner@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"댓글 글쓴이"}', now(), now(), now()
  ),
  (
    '13000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
    'comment-other@foodcafe.invalid', '', '{"provider":"email","providers":["email"]}',
    '{"display_name":"댓글 방문자"}', now(), now(), now()
  );

insert into public.posts (id, title, writer_uid, writer_name, category)
values ('23000000-0000-4000-8000-000000000001', '부모 제약 게시글', '13000000-0000-4000-8000-000000000001', '댓글 글쓴이', 'free');

insert into public.recipes (id, title, image, steps, ingredients, writer_uid, writer_name)
values ('33000000-0000-4000-8000-000000000001', '부모 제약 레시피', 'recipes/test/comment.jpg', '[]', '[]', '13000000-0000-4000-8000-000000000001', '댓글 글쓴이');

insert into public.combos (id, title, items, writer_uid, writer_name)
values ('43000000-0000-4000-8000-000000000001', '부모 제약 조합', '[]', '13000000-0000-4000-8000-000000000001', '댓글 글쓴이');

-- 제약: 부모는 정확히 하나이고 실제로 존재해야 한다.
select extensions.throws_ok(
  $$insert into public.comments (id, content, writer_name)
    values ('63000000-0000-4000-8000-000000000090', '부모 없음', '테스트')$$,
  '23514',
  null,
  '부모가 없는 댓글은 저장할 수 없다'
);

select extensions.throws_ok(
  $$insert into public.comments (id, recipe_id, combo_id, content, writer_name)
    values (
      '63000000-0000-4000-8000-000000000091',
      '33000000-0000-4000-8000-000000000001',
      '43000000-0000-4000-8000-000000000001',
      '부모 둘', '테스트'
    )$$,
  '23514',
  null,
  '부모가 둘인 댓글은 저장할 수 없다'
);

select extensions.throws_ok(
  $$insert into public.comments (id, recipe_id, content, writer_name)
    values ('63000000-0000-4000-8000-000000000092', '33000000-0000-4000-8000-0000000000ff', '없는 부모', '테스트')$$,
  '23503',
  null,
  '존재하지 않는 부모에는 댓글을 저장할 수 없다'
);

-- 댓글 수: 부모 작성자가 아닌 사용자의 댓글도 부모 카운트에 반영된다.
select set_config('request.jwt.claim.sub', '13000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"13000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
insert into public.comments (id, post_id, content)
values ('63000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000001', '게시글 방문 댓글');
insert into public.comments (id, recipe_id, content)
values ('63000000-0000-4000-8000-000000000002', '33000000-0000-4000-8000-000000000001', '레시피 방문 댓글');
insert into public.comments (id, combo_id, content)
values ('63000000-0000-4000-8000-000000000003', '43000000-0000-4000-8000-000000000001', '조합 방문 댓글');
reset role;

select extensions.is(
  (select (select comment_count from public.posts where id = '23000000-0000-4000-8000-000000000001')::text
    || ':' || (select comment_count from public.recipes where id = '33000000-0000-4000-8000-000000000001')::text
    || ':' || (select comment_count from public.combos where id = '43000000-0000-4000-8000-000000000001')::text),
  '1:1:1',
  '다른 사용자의 글에 단 댓글도 부모 댓글 수를 올린다'
);

set local role authenticated;
update public.comments set deleted_at = now() where id = '63000000-0000-4000-8000-000000000002';
reset role;

select extensions.is(
  (select comment_count from public.recipes where id = '33000000-0000-4000-8000-000000000001'),
  0,
  '댓글 작성자가 소프트 삭제하면 다른 사용자의 부모 댓글 수가 줄어든다'
);

set local role authenticated;
update public.comments set deleted_at = null where id = '63000000-0000-4000-8000-000000000002';
reset role;

select extensions.is(
  (select comment_count from public.recipes where id = '33000000-0000-4000-8000-000000000001'),
  1,
  '소프트 삭제한 댓글을 복원하면 부모 댓글 수가 다시 늘어난다'
);

-- CASCADE: 부모 삭제 시 해당 부모의 댓글만 함께 삭제된다.
delete from public.recipes where id = '33000000-0000-4000-8000-000000000001';

select extensions.is(
  (select count(*)::integer from public.comments where id = '63000000-0000-4000-8000-000000000002'),
  0,
  '레시피를 삭제하면 그 레시피의 댓글이 함께 삭제된다'
);

select extensions.is(
  (select count(*)::integer from public.comments where id in (
    '63000000-0000-4000-8000-000000000001',
    '63000000-0000-4000-8000-000000000003'
  )),
  2,
  '레시피 삭제는 다른 부모의 댓글을 지우지 않는다'
);

delete from public.posts where id = '23000000-0000-4000-8000-000000000001';

select extensions.is(
  (select count(*)::integer from public.comments where id = '63000000-0000-4000-8000-000000000001'),
  0,
  '게시글을 삭제하면 그 게시글의 댓글이 함께 삭제된다'
);

delete from public.combos where id = '43000000-0000-4000-8000-000000000001';

select extensions.is(
  (select count(*)::integer from public.comments where id = '63000000-0000-4000-8000-000000000003'),
  0,
  '조합을 삭제하면 그 조합의 댓글이 함께 삭제된다'
);

select * from extensions.finish();
rollback;
