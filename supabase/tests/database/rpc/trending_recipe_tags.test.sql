begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(7);

-- 로컬 테스트 DB에서만 실행한다. 모든 변경은 끝에서 롤백한다.
-- 다른 데이터의 최근 활동은 기간 밖으로 밀어 고정 데이터만 집계되게 한다.
-- 좋아요·북마크·댓글 수 Trigger는 시각 변경에 반응하지 않으므로 레시피 카운터는 그대로다.
update public.recipe_likes set created_at = created_at - interval '100 years' where created_at >= now() - interval '2 months';
update public.recipe_bookmarks set created_at = created_at - interval '100 years' where created_at >= now() - interval '2 months';
update public.comments set created_at = created_at - interval '100 years'
where recipe_id is not null and created_at >= now() - interval '2 months';

insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('95000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'tag-u1@test.local', '{"display_name":"태그 사용자1"}', now(), now()),
  ('95000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'tag-u2@test.local', '{"display_name":"태그 사용자2"}', now(), now()),
  ('95000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'tag-u3@test.local', '{"display_name":"태그 사용자3"}', now(), now()),
  ('95000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'tag-u4@test.local', '{"display_name":"태그 사용자4"}', now(), now());

-- 태그 앞뒤 공백은 같은 태그로 합친다. 공백뿐인 태그는 recipes_tags_items 제약이 저장부터 막는다.
insert into public.recipes (id, title, steps, image, tags)
values
  ('95000000-0000-4000-8000-000000000011', '태그 레시피1', '[]'::jsonb, 'test-image', array['태그검증가', '태그검증나']),
  ('95000000-0000-4000-8000-000000000012', '태그 레시피2', '[]'::jsonb, 'test-image', array['태그검증가']),
  ('95000000-0000-4000-8000-000000000013', '태그 레시피3', '[]'::jsonb, 'test-image', array[' 태그검증나 ']),
  ('95000000-0000-4000-8000-000000000014', '태그 레시피4', '[]'::jsonb, 'test-image', array['태그검증다']),
  ('95000000-0000-4000-8000-000000000015', '태그 레시피5', '[]'::jsonb, 'test-image', array['태그검증라']),
  ('95000000-0000-4000-8000-000000000016', '태그 레시피6', '[]'::jsonb, 'test-image', array['태그검증마']),
  ('95000000-0000-4000-8000-000000000017', '활동 없는 레시피', '[]'::jsonb, 'test-image', array['태그검증가']);

-- now()는 트랜잭션 시작 시각으로 고정되고, 함수의 기간 시작은 그보다 늦은 문장 시각 기준이다.
insert into public.recipe_likes (user_id, recipe_id, created_at)
values
  -- 가·나: 레시피1에 두 명이 좋아요(두 태그 모두에 잡힌다).
  ('95000000-0000-4000-8000-000000000001', '95000000-0000-4000-8000-000000000011', now() - interval '1 hour'),
  ('95000000-0000-4000-8000-000000000002', '95000000-0000-4000-8000-000000000011', now() - interval '2 hours'),
  -- 나: 공백이 붙은 태그의 레시피3.
  ('95000000-0000-4000-8000-000000000004', '95000000-0000-4000-8000-000000000013', now() - interval '3 hours'),
  -- 가: 8일 전 좋아요는 주간에서 빠지고 월간에는 들어간다.
  ('95000000-0000-4000-8000-000000000004', '95000000-0000-4000-8000-000000000012', now() - interval '8 days'),
  -- 라·마: 점수·참여자·레시피 수·마지막 활동 시각이 모두 같으면 태그 이름 순이다.
  ('95000000-0000-4000-8000-000000000003', '95000000-0000-4000-8000-000000000016', now() - interval '5 hours'),
  ('95000000-0000-4000-8000-000000000003', '95000000-0000-4000-8000-000000000015', now() - interval '5 hours');

insert into public.recipe_bookmarks (user_id, recipe_id, created_at)
values ('95000000-0000-4000-8000-000000000001', '95000000-0000-4000-8000-000000000012', now() - interval '2 hours');

insert into public.comments (writer_uid, recipe_id, content, created_at, deleted_at)
values
  ('95000000-0000-4000-8000-000000000003', '95000000-0000-4000-8000-000000000012', '댓글', now() - interval '3 hours', null),
  -- 지운 댓글은 활동으로 세지 않는다.
  ('95000000-0000-4000-8000-000000000004', '95000000-0000-4000-8000-000000000011', '지운 댓글', now() - interval '1 hour', now());

-- 점수 = 참여자 × 10 + 좋아요 × 2 + 북마크 × 3 + 댓글 × 4
--   가: 참여자 3(사용자1·2·3), 좋아요 2, 북마크 1, 댓글 1 → 41. 레시피 2개 활동, 전체 3개.
--   나: 참여자 3(사용자1·2·4), 좋아요 3 → 36. 레시피 2개 활동, 전체 2개(공백 태그 포함).
--   라·마: 참여자 1, 좋아요 1 → 12.
select extensions.results_eq(
  $$
    select tag, recent_recipe_count, total_recipe_count, recent_like_count, recent_bookmark_count,
      recent_comment_count, recent_participant_count, recent_activity_count, trend_score
    from public.get_trending_recipe_tags('week', 10)
  $$,
  $$
    values
      ('태그검증가'::text, 2::bigint, 3::bigint, 2::bigint, 1::bigint, 1::bigint, 3::bigint, 4::bigint, 41::bigint),
      ('태그검증나', 2, 2, 3, 0, 0, 3, 3, 36),
      ('태그검증라', 1, 1, 1, 0, 0, 1, 1, 12),
      ('태그검증마', 1, 1, 1, 0, 0, 1, 1, 12)
  $$,
  '주간 태그 트렌딩은 활동을 태그별로 모으고 점수·동점 순서대로 돌려준다'
);

select extensions.is(
  (select last_activity_at from public.get_trending_recipe_tags('week', 10) where tag = '태그검증가'),
  now() - interval '1 hour',
  '마지막 활동 시각은 그 태그에서 가장 최근 활동 시각이다'
);

select extensions.results_eq(
  $$
    select tag, recent_like_count, recent_participant_count, trend_score
    from public.get_trending_recipe_tags('month', 10)
    where tag = '태그검증가'
  $$,
  $$ values ('태그검증가'::text, 3::bigint, 4::bigint, 53::bigint) $$,
  '월간은 8일 전 활동까지 포함한다'
);

select extensions.is(
  (select count(*) from public.get_trending_recipe_tags('day', 10) where tag = '태그검증가'),
  1::bigint,
  '일간도 최근 몇 시간 안의 활동은 포함한다'
);

select extensions.results_eq(
  $$ select tag from public.get_trending_recipe_tags('week', 1) $$,
  $$ values ('태그검증가'::text) $$,
  '개수 제한만큼 위에서부터 돌려준다'
);

select extensions.results_eq(
  $$ select tag from public.get_trending_recipe_tags('week', 0) $$,
  $$ values ('태그검증가'::text) $$,
  '개수 제한이 1보다 작으면 1개를 돌려준다'
);

select extensions.is(
  (select count(*) from public.get_trending_recipe_tags('week', 10) where tag = '태그검증다'),
  0::bigint,
  '기간 안에 활동이 없는 태그는 나오지 않는다'
);

select * from extensions.finish();

rollback;
