begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(5);

-- 로컬 테스트 DB에서만 실행한다. 모든 변경은 끝에서 롤백한다.
-- 다른 데이터의 최근 활동은 기간 밖으로 밀어 고정 데이터만 집계되게 한다.
-- 좋아요·북마크·댓글 수 Trigger는 시각 변경에 반응하지 않으므로 레시피 카운터는 그대로다.
update public.recipe_likes set created_at = created_at - interval '100 years' where created_at >= now() - interval '2 months';
update public.recipe_bookmarks set created_at = created_at - interval '100 years' where created_at >= now() - interval '2 months';
update public.comments set created_at = created_at - interval '100 years'
where recipe_id is not null and created_at >= now() - interval '2 months';

insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('96000000-0000-4000-8000-000000000011', 'authenticated', 'authenticated', 'trend-u1@test.local', '{"display_name":"트렌드 사용자1"}', now(), now()),
  ('96000000-0000-4000-8000-000000000012', 'authenticated', 'authenticated', 'trend-u2@test.local', '{"display_name":"트렌드 사용자2"}', now(), now()),
  ('96000000-0000-4000-8000-000000000013', 'authenticated', 'authenticated', 'trend-u3@test.local', '{"display_name":"트렌드 사용자3"}', now(), now()),
  ('96000000-0000-4000-8000-000000000014', 'authenticated', 'authenticated', 'trend-u4@test.local', '{"display_name":"트렌드 사용자4"}', now(), now());

insert into public.recipes (id, title, steps, image)
values
  ('96000000-0000-4000-8000-000000000001', '트렌드 레시피1', '[]'::jsonb, 'test-image'),
  ('96000000-0000-4000-8000-000000000002', '트렌드 레시피2', '[]'::jsonb, 'test-image'),
  ('96000000-0000-4000-8000-000000000003', '트렌드 레시피3', '[]'::jsonb, 'test-image'),
  ('96000000-0000-4000-8000-000000000004', '트렌드 레시피4', '[]'::jsonb, 'test-image'),
  ('96000000-0000-4000-8000-000000000005', '트렌드 레시피5', '[]'::jsonb, 'test-image'),
  ('96000000-0000-4000-8000-000000000006', '트렌드 레시피6', '[]'::jsonb, 'test-image');

-- now()는 트랜잭션 시작 시각으로 고정되고, 함수의 기간 시작은 그보다 늦은 문장 시각 기준이다.
-- 점수 = 참여자 × 10 + 좋아요 × 2 + 북마크 × 3 + 댓글 × 4
insert into public.recipe_likes (user_id, recipe_id, created_at)
values
  -- 레시피1: 참여자 2, 좋아요 2 → 24
  ('96000000-0000-4000-8000-000000000011', '96000000-0000-4000-8000-000000000001', now() - interval '1 hour'),
  ('96000000-0000-4000-8000-000000000012', '96000000-0000-4000-8000-000000000001', now() - interval '2 hours'),
  -- 레시피2: 참여자 2, 좋아요 1·북마크 1·댓글 1 → 29
  ('96000000-0000-4000-8000-000000000013', '96000000-0000-4000-8000-000000000002', now() - interval '1 hour'),
  -- 레시피3: 레시피1과 모든 값이 같다 → id 순
  ('96000000-0000-4000-8000-000000000011', '96000000-0000-4000-8000-000000000003', now() - interval '3 hours'),
  ('96000000-0000-4000-8000-000000000012', '96000000-0000-4000-8000-000000000003', now() - interval '3 hours'),
  -- 레시피5: 참여자 2, 좋아요 1·댓글 1 → 26 (레시피4와 점수·참여자가 같고 북마크가 적다)
  ('96000000-0000-4000-8000-000000000011', '96000000-0000-4000-8000-000000000005', now() - interval '4 hours'),
  -- 레시피6: 8일 전이라 주간에서 빠지고 월간에는 들어간다 → 12
  ('96000000-0000-4000-8000-000000000014', '96000000-0000-4000-8000-000000000006', now() - interval '8 days');

insert into public.recipe_bookmarks (user_id, recipe_id, created_at)
values
  ('96000000-0000-4000-8000-000000000013', '96000000-0000-4000-8000-000000000002', now() - interval '1 hour'),
  -- 레시피4: 참여자 2, 북마크 2 → 26
  ('96000000-0000-4000-8000-000000000011', '96000000-0000-4000-8000-000000000004', now() - interval '4 hours'),
  ('96000000-0000-4000-8000-000000000012', '96000000-0000-4000-8000-000000000004', now() - interval '4 hours');

insert into public.comments (writer_uid, recipe_id, content, created_at, deleted_at)
values
  ('96000000-0000-4000-8000-000000000014', '96000000-0000-4000-8000-000000000002', '댓글', now() - interval '2 hours', null),
  ('96000000-0000-4000-8000-000000000012', '96000000-0000-4000-8000-000000000005', '댓글', now() - interval '4 hours', null),
  -- 지운 댓글은 활동으로 세지 않는다(세면 레시피1의 참여자가 3이 된다).
  ('96000000-0000-4000-8000-000000000013', '96000000-0000-4000-8000-000000000001', '지운 댓글', now() - interval '1 hour', now());

select extensions.results_eq(
  $$
    select id, title, recent_like_count, recent_bookmark_count, recent_comment_count,
      recent_participant_count, recent_activity_count, trend_score
    from public.get_trending_recipes('week', 10)
  $$,
  $$
    values
      ('96000000-0000-4000-8000-000000000002'::uuid, '트렌드 레시피2'::text, 1::bigint, 1::bigint, 1::bigint, 2::bigint, 3::bigint, 29::bigint),
      ('96000000-0000-4000-8000-000000000004', '트렌드 레시피4', 0, 2, 0, 2, 2, 26),
      ('96000000-0000-4000-8000-000000000005', '트렌드 레시피5', 1, 0, 1, 2, 2, 26),
      ('96000000-0000-4000-8000-000000000001', '트렌드 레시피1', 2, 0, 0, 2, 2, 24),
      ('96000000-0000-4000-8000-000000000003', '트렌드 레시피3', 2, 0, 0, 2, 2, 24)
  $$,
  '주간 인기 레시피는 점수 → 참여자 → 북마크 → id 순으로 정렬하고 레시피 정보를 함께 돌려준다'
);

select extensions.is(
  (select last_activity_at from public.get_trending_recipes('week', 10) where id = '96000000-0000-4000-8000-000000000002'),
  now() - interval '1 hour',
  '마지막 활동 시각은 그 레시피에서 가장 최근 활동 시각이다'
);

select extensions.results_eq(
  $$
    select id, trend_score from public.get_trending_recipes('month', 10)
    where id = '96000000-0000-4000-8000-000000000006'
  $$,
  $$ values ('96000000-0000-4000-8000-000000000006'::uuid, 12::bigint) $$,
  '월간은 8일 전 활동까지 포함한다'
);

select extensions.results_eq(
  $$ select id from public.get_trending_recipes('week', 2) $$,
  $$ values ('96000000-0000-4000-8000-000000000002'::uuid), ('96000000-0000-4000-8000-000000000004'::uuid) $$,
  '개수 제한만큼 위에서부터 돌려준다'
);

select extensions.is(
  (select count(*) from public.get_trending_recipes('week', 10) where id = '96000000-0000-4000-8000-000000000006'),
  0::bigint,
  '주간에는 기간 밖 활동만 있는 레시피가 나오지 않는다'
);

select * from extensions.finish();

rollback;
