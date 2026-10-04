-- 부하 테스트용 대량 데이터. 로컬 Supabase DB에서만 실행한다(원격 DB 금지).
--   넣기:   docker exec -i supabase_db_vtkcngubofjqddqvcufp psql -U postgres -v ON_ERROR_STOP=1 < tools/k6/seed/bulk-data.sql
--   지우기: docker exec -i supabase_db_vtkcngubofjqddqvcufp psql -U postgres -v ON_ERROR_STOP=1 < tools/k6/seed/cleanup.sql
--
-- 만드는 양: 사용자 1,000 · 레시피 10,000 · 조합 1,000 · 레시피 좋아요 약 9만 · 레시피 북마크 약 2.4만
--            · 조합 좋아요·북마크 약 1.8만 · 레시피·조합 댓글 3.5만
--            · 게시글 5,000 · 게시글 좋아요·북마크 · 게시글 댓글 1.5만 · 팔로우
-- 게시글·팔로우는 나중에 추가해 맨 끝에서 만든다. 앞 단계의 무작위 순서를 바꾸지 않아 레시피·조합 데이터는 그대로다.
-- 모든 행은 부하 테스트 사용자(이메일 @loadtest.test)가 쓴 것이라, 사용자만 지우면 CASCADE로 함께 지워진다.
-- 좋아요·댓글 수는 실제 서비스처럼 Trigger가 센다. 인기는 소수 글에 몰리고(멱함수), 최근 활동이 더 많다.
-- setseed로 분포를 고정해 개선 전후를 같은 조건에서 비교한다(id 값만 실행마다 다르다).

begin;

do $$
begin
  if exists (select 1 from auth.users where email like '%@loadtest.test') then
    raise exception '이미 부하 테스트 데이터가 있습니다. cleanup.sql로 지운 뒤 다시 실행하세요.';
  end if;
end $$;

select setseed(0.20261004);

-- 배열에서 무작위로 하나, 또는 서로 다른 k개를 고른다.
create function pg_temp.pick(items text[]) returns text
language sql volatile as $$
  select items[1 + floor(random() * array_length(items, 1))::int]
$$;

create function pg_temp.pick_n(items text[], k int) returns text[]
language sql volatile as $$
  select array(select item from unnest(items) as item order by random() limit k)
$$;

create function pg_temp.make_steps(k int) returns jsonb
language sql volatile as $$
  select jsonb_agg(jsonb_build_object('description', step))
  from unnest(pg_temp.pick_n(array[
    '재료를 먹기 좋은 크기로 손질한다.',
    '팬을 중불로 달구고 기름을 두른다.',
    '양념 재료를 한데 섞어 둔다.',
    '주재료를 넣고 겉면이 익을 때까지 볶는다.',
    '물을 붓고 끓어오르면 불을 줄인다.',
    '양념을 넣고 골고루 버무린다.',
    '뚜껑을 덮고 5분간 뜸을 들인다.',
    '간을 보고 소금으로 맞춘다.',
    '그릇에 담고 깨와 파를 뿌려 마무리한다.',
    '오븐을 180도로 예열한다.',
    '반죽을 30분간 휴지시킨다.',
    '찬물에 헹궈 물기를 뺀다.'
  ], k)) as step
$$;

create function pg_temp.make_ingredients(k int) returns jsonb
language sql volatile as $$
  select jsonb_agg(jsonb_build_object(
    'name', name,
    'unit', pg_temp.pick(array['g', '개', '큰술', '작은술', '컵', 'ml']),
    'amount', (1 + floor(random() * 4))::text,
    'unitCustom', ''
  ))
  from unnest(pg_temp.pick_n(array[
    '김치', '돼지고기', '닭가슴살', '두부', '계란', '감자', '양파', '버섯', '새우', '연어',
    '소고기', '애호박', '시금치', '대파', '고구마', '치즈', '베이컨', '참치', '오징어', '브로콜리',
    '마늘', '간장', '고추장', '설탕', '참기름', '올리브유', '우유', '밀가루', '버터', '토마토'
  ], k)) as name
$$;

-- 게시글 본문. 에디터 저장 형식(Lexical JSON)과 같은 내용의 텍스트·HTML을 함께 만든다.
create function pg_temp.make_post_body(k int) returns table(body_json jsonb, body_text text, body_html text)
language sql volatile as $$
  with paras as (
    select ord, pg_temp.pick(array[
        '오늘 저녁에 냉장고 정리 겸 남은 채소로 볶음밥을 만들어 봤어요.',
        '레시피대로 했는데 간이 조금 세게 나와서 물을 반 컵 더 넣었습니다.',
        '에어프라이어 온도를 10도 낮추니까 겉은 바삭하고 속은 촉촉했어요.',
        '자취방 작은 주방에서도 30분이면 충분히 만들 수 있는 메뉴입니다.',
        '아이들이 채소를 잘 안 먹어서 잘게 다져 넣었더니 잘 먹더라고요.',
        '양념은 전날 미리 만들어 두면 맛이 훨씬 잘 어우러집니다.'
      ]) || ' ' || pg_temp.pick(array[
        '다음에는 고기 양을 조금 늘려 볼 생각이에요.',
        '혹시 더 맛있게 만드는 팁이 있으면 알려 주세요.',
        '사진은 조금 어둡게 나왔지만 맛은 정말 괜찮았습니다.',
        '재료비는 1인분 기준으로 5천 원 정도 들었어요.',
        '설거지가 적게 나와서 평일 저녁에 특히 좋았습니다.',
        '같은 방법으로 두부를 넣어도 잘 어울릴 것 같아요.'
      ]) as para
    from generate_series(1, k) as ord
  )
  select
    jsonb_build_object('root', jsonb_build_object(
      'children', jsonb_agg(jsonb_build_object(
        'children', jsonb_build_array(jsonb_build_object(
          'detail', 0, 'format', 0, 'mode', 'normal', 'style', '', 'text', para, 'type', 'text', 'version', 1
        )),
        'direction', 'ltr', 'format', '', 'indent', 0, 'type', 'paragraph', 'version', 1,
        'textFormat', 0, 'textStyle', ''
      ) order by ord),
      'direction', 'ltr', 'format', '', 'indent', 0, 'type', 'root', 'version', 1
    )),
    string_agg(para, E'\n' order by ord),
    string_agg(format('<p dir="ltr"><span style="white-space: pre-wrap;">%s</span></p>', para), '' order by ord)
  from paras
$$;

create temp table lt_users on commit drop as
select n, gen_random_uuid() as id from generate_series(1, 1000) as n;

create temp table lt_recipe_images on commit drop as
select array_agg(distinct image) as images from public.recipes where image is not null;

create temp table lt_combo_images on commit drop as
select array_agg(distinct image) as images from public.combos where image is not null;

-- 1. 사용자 1,000명. 가입 Trigger가 profiles·user_roles를 만든다.
-- 인증 서버(GoTrue)는 토큰 컬럼을 빈 문자열로 가정하고 사용자 목록을 읽는다. NULL이 섞이면
-- "Database error finding users"로 비밀번호 재설정 같은 관리 기능 전체가 실패하므로 실제 가입처럼 ''로 채운다.
insert into auth.users (
  instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
  format('lt-%s@loadtest.test', lpad(u.n::text, 4, '0')),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', format('%s%s%s',
    pg_temp.pick(array['배고픈', '요리하는', '자취하는', '퇴근한', '부지런한', '느긋한', '매운맛', '단짠']),
    pg_temp.pick(array['고양이', '곰', '토끼', '요리사', '미식가', '자취생', '집밥러', '야식왕']),
    u.n)),
  now(), now() - random() * interval '400 days', now(),
  '', '', '', '', '', '', '', ''
from lt_users as u;

-- 2. 레시피 10,000개. 최근 글이 더 많다.
create temp table lt_recipes on commit drop as
select n, gen_random_uuid() as id, 1 + floor(random() * 1000)::int as writer_n
from generate_series(1, 10000) as n;

insert into public.recipes (
  id, title, summary, steps, ingredients, image, images, category, tags, difficulty,
  time_minutes, servings, tools, tools_required, chef_tip, writer_uid, created_at, updated_at
)
select
  r.id,
  format('%s %s %s',
    pg_temp.pick(array['매콤한', '간단한', '초간단', '든든한', '건강한', '바삭한', '촉촉한', '엄마표', '자취생', '10분', '다이어트', '술안주']),
    pg_temp.pick(array['김치', '돼지고기', '닭가슴살', '두부', '계란', '감자', '양파', '버섯', '새우', '연어', '소고기', '애호박', '시금치', '대파', '고구마', '치즈', '베이컨', '참치', '오징어', '브로콜리']),
    pg_temp.pick(array['찌개', '볶음', '조림', '구이', '덮밥', '샐러드', '파스타', '국', '전', '무침', '튀김', '카레', '볶음밥', '비빔밥', '샌드위치', '리조또'])),
  pg_temp.pick(array[
    '냉장고 속 재료로 금방 만드는 한 끼.',
    '밥 한 공기 뚝딱 비우게 되는 메뉴.',
    '주말 브런치로 좋은 간단 요리.',
    '도시락 반찬으로도 잘 어울린다.',
    '아이도 잘 먹는 순한 맛.',
    '야식으로 딱 좋은 매콤한 맛.'
  ]),
  pg_temp.make_steps(3 + floor(random() * 5)::int),
  pg_temp.make_ingredients(3 + floor(random() * 6)::int),
  pg_temp.pick((select images from lt_recipe_images)),
  '{}'::text[],
  pg_temp.pick(array['한식', '고기·구이', '분식', '중식', '일식', '양식', '아시안', '샐러드·건강식', '디저트·베이킹', '간식·야식', '기타']),
  pg_temp.pick_n(array['다이어트', '고단백', '에어프라이어', '집밥', '자취', '간단', '매운맛', '도시락', '야식', '비건', '아이반찬', '술안주', '손님초대', '저탄수', '원팬'], 2 + floor(random() * 4)::int),
  pg_temp.pick(array['매우 쉬움', '쉬움', '쉬움', '보통', '어려움']),
  (5 + floor(random() * 12) * 5)::int,
  1 + floor(random() * 4)::int,
  pg_temp.pick_n(array['프라이팬', '냄비', '에어프라이어', '전자레인지', '오븐'], floor(random() * 3)::int),
  random() < 0.2,
  pg_temp.pick(array['불 조절이 맛을 좌우한다.', '양념은 미리 섞어 두면 편하다.', '남은 재료는 볶음밥으로 쓰면 좋다.', null]),
  u.id,
  created.at,
  created.at
from lt_recipes as r
join lt_users as u on u.n = r.writer_n
cross join lateral (select now() - power(random(), 1.5) * interval '730 days' + r.n * interval '0 seconds' as at) as created;

-- 3. 조합 1,000개. 항목은 위 레시피 2~5개와 가끔 시판 상품 하나.
create temp table lt_combos on commit drop as
select n, gen_random_uuid() as id, 1 + floor(random() * 1000)::int as writer_n
from generate_series(1, 1000) as n;

insert into public.combos (
  id, title, summary, steps, items, tags, difficulty, time_minutes, tools_required, image,
  writer_uid, created_at, updated_at
)
select
  c.id,
  format('%s %s 한 상', pg_temp.pick(array['주말', '퇴근 후', '혼밥', '손님상', '다이어트', '야식', '아침', '도시락']), c.n),
  pg_temp.pick(array['메인과 반찬을 한 번에 준비하는 조합.', '30분 안에 차리는 한 상.', '한 그릇으로 끝내는 든든한 구성.']),
  pg_temp.make_steps(2 + floor(random() * 3)::int),
  items.value,
  pg_temp.pick_n(array['집밥', '한식', '정식', '간단', '혼밥', '손님초대', '다이어트', '야식'], 2 + floor(random() * 2)::int),
  pg_temp.pick(array['쉬움', '보통', '어려움']),
  (15 + floor(random() * 10) * 5)::int,
  random() < 0.2,
  pg_temp.pick((select images from lt_combo_images)),
  u.id,
  created.at,
  created.at
from lt_combos as c
join lt_users as u on u.n = c.writer_n
cross join lateral (select now() - power(random(), 1.5) * interval '730 days' + c.n * interval '0 seconds' as at) as created
cross join lateral (
  select jsonb_agg(item) as value
  from (
    select jsonb_build_object(
      'type', 'recipe', 'image', recipe.image, 'title', recipe.title,
      'summary', recipe.summary, 'recipeid', recipe.id
    ) as item
    from (
      select 1 + floor(random() * 10000)::int as rn
      from generate_series(1, 2 + floor(random() * 4)::int + c.n * 0)
    ) as pick
    join lt_recipes as lr on lr.n = pick.rn
    join public.recipes as recipe on recipe.id = lr.id
    union all
    select jsonb_build_object('type', 'product', 'summary', '데우기만 하면 되는 즉석밥', 'productName', '즉석밥')
    where random() < 0.3 + c.n * 0
  ) as picked
) as items;

-- 4. 좋아요·북마크. 인기 글에 몰리고(멱함수), 최근 90일 활동이 많다. 중복은 기본키가 막는다.
insert into public.recipe_likes (user_id, recipe_id, created_at)
select u.id, r.id, now() - power(random(), 2) * interval '90 days'
from lt_users as u
cross join lateral (
  select 1 + floor(10000 * power(random(), 3))::int as rn
  from generate_series(1, 60 + u.n % 80)
) as pick
join lt_recipes as r on r.n = pick.rn
on conflict do nothing;

insert into public.recipe_bookmarks (user_id, recipe_id, created_at)
select u.id, r.id, now() - power(random(), 2) * interval '180 days'
from lt_users as u
cross join lateral (
  select 1 + floor(10000 * power(random(), 2))::int as rn
  from generate_series(1, 10 + u.n % 30)
) as pick
join lt_recipes as r on r.n = pick.rn
on conflict do nothing;

insert into public.combo_likes (user_id, combo_id, created_at)
select u.id, c.id, now() - power(random(), 2) * interval '90 days'
from lt_users as u
cross join lateral (
  select 1 + floor(1000 * power(random(), 2.5))::int as cn
  from generate_series(1, 5 + u.n % 20)
) as pick
join lt_combos as c on c.n = pick.cn
on conflict do nothing;

insert into public.combo_bookmarks (user_id, combo_id, created_at)
select u.id, c.id, now() - power(random(), 2) * interval '180 days'
from lt_users as u
cross join lateral (
  select 1 + floor(1000 * power(random(), 2))::int as cn
  from generate_series(1, 2 + u.n % 6)
) as pick
join lt_combos as c on c.n = pick.cn
on conflict do nothing;

-- 5. 댓글. 레시피 3만·조합 5천. 무작위 대상은 먼저 뽑아 두고 조인한다(조인 조건 안의 random()은 비교마다 다시 뽑힌다).
insert into public.comments (writer_uid, recipe_id, content, created_at, updated_at)
select u.id, r.id, pg_temp.pick(array[
    '오늘 저녁으로 해 먹었어요. 맛있어요!', '양념 비율이 딱 좋네요.', '간단해서 자주 만들게 돼요.',
    '아이들이 잘 먹었어요.', '조금 짰는데 다음엔 간장을 줄여볼게요.', '사진이랑 똑같이 나왔어요.'
  ]), pick.at, pick.at
from (
  select
    1 + floor(10000 * power(random(), 2.5))::int as rn,
    1 + floor(random() * 1000)::int as un,
    now() - power(random(), 2) * interval '180 days' as at
  from generate_series(1, 30000)
) as pick
join lt_recipes as r on r.n = pick.rn
join lt_users as u on u.n = pick.un;

insert into public.comments (writer_uid, combo_id, content, created_at, updated_at)
select u.id, c.id, pg_temp.pick(array['구성이 알차네요.', '주말에 따라 해봤어요.', '시간이 딱 맞아요.']), pick.at, pick.at
from (
  select
    1 + floor(1000 * power(random(), 2.5))::int as cn,
    1 + floor(random() * 1000)::int as un,
    now() - power(random(), 2) * interval '180 days' as at
  from generate_series(1, 5000)
) as pick
join lt_combos as c on c.n = pick.cn
join lt_users as u on u.n = pick.un;

-- 6. 조회수는 좋아요가 많을수록 많게 준다(조회 기록 표는 따로 없고 숫자만 쌓는다).
update public.recipes as recipe
set view_count = recipe.like_count * (10 + floor(random() * 20))::int + floor(random() * 200)::int
from lt_recipes as r
where recipe.id = r.id;

update public.combos as combo
set view_count = combo.like_count * (10 + floor(random() * 20))::int + floor(random() * 200)::int
from lt_combos as c
where combo.id = c.id;

-- 7. 커뮤니티 게시글 5,000개. 대부분 3~5문단이고 가끔 20문단 가까이 되는 긴 글이 있다.
create temp table lt_posts on commit drop as
select n, gen_random_uuid() as id, 1 + floor(random() * 1000)::int as writer_n
from generate_series(1, 5000) as n;

insert into public.posts (
  id, writer_uid, title, category, tags, content_json, content_text, content_html, created_at, updated_at
)
select
  p.id,
  u.id,
  format('%s %s',
    pg_temp.pick(array['오늘', '주말', '자취생', '초보', '다이어트', '퇴근 후']),
    pg_temp.pick(array['저녁 메뉴 후기', '볶음밥 성공했어요', '양념 비율 질문', '에어프라이어 팁 공유', '장보기 꿀팁', '실패한 요리 이야기', '도시락 메뉴 추천'])),
  pg_temp.pick(array['free', 'free', 'recipe_tip', 'question', 'review']),
  pg_temp.pick_n(array['자취', '다이어트', '집밥', '에어프라이어', '도시락', '간단'], floor(random() * 3)::int),
  body.body_json,
  body.body_text,
  body.body_html,
  created.at,
  created.at
from lt_posts as p
join lt_users as u on u.n = p.writer_n
cross join lateral (select now() - power(random(), 1.5) * interval '730 days' + p.n * interval '0 seconds' as at) as created
cross join lateral pg_temp.make_post_body(3 + floor(power(random(), 3) * 18)::int + p.n * 0) as body;

insert into public.post_likes (user_id, post_id, created_at)
select u.id, p.id, now() - power(random(), 2) * interval '90 days'
from lt_users as u
cross join lateral (
  select 1 + floor(5000 * power(random(), 2.5))::int as pn
  from generate_series(1, 5 + u.n % 25)
) as pick
join lt_posts as p on p.n = pick.pn
on conflict do nothing;

insert into public.post_bookmarks (user_id, post_id, created_at)
select u.id, p.id, now() - power(random(), 2) * interval '180 days'
from lt_users as u
cross join lateral (
  select 1 + floor(5000 * power(random(), 2))::int as pn
  from generate_series(1, 1 + u.n % 6)
) as pick
join lt_posts as p on p.n = pick.pn
on conflict do nothing;

insert into public.comments (writer_uid, post_id, content, created_at, updated_at)
select u.id, p.id, pg_temp.pick(array[
    '저도 같은 경험 있어요!', '팁 감사합니다. 바로 해볼게요.', '양념은 간장 2 설탕 1 정도가 무난해요.',
    '사진 보니 맛있어 보이네요.', '질문 있는데 불은 중불인가요?'
  ]), pick.at, pick.at
from (
  select
    1 + floor(5000 * power(random(), 2.5))::int as pn,
    1 + floor(random() * 1000)::int as un,
    now() - power(random(), 2) * interval '180 days' as at
  from generate_series(1, 15000)
) as pick
join lt_posts as p on p.n = pick.pn
join lt_users as u on u.n = pick.un;

update public.posts as post
set view_count = post.like_count * (10 + floor(random() * 20))::int + floor(random() * 300)::int
from lt_posts as p
where post.id = p.id;

-- 8. 팔로우. 각자 3~30명을 팔로우하고, 인기 작성자(번호가 앞쪽)에게 몰린다. 자기 자신은 뺀다.
insert into public.user_follows (follower_id, following_id, created_at)
select u.id, target.id, now() - random() * interval '365 days'
from lt_users as u
cross join lateral (
  select 1 + floor(1000 * power(random(), 2))::int as tn
  from generate_series(1, 3 + u.n % 28)
) as pick
join lt_users as target on target.n = pick.tn
where target.n <> u.n
on conflict do nothing;

commit;

-- 좋아요·댓글 15만 건이 한꺼번에 들어가며 Trigger가 레시피·조합 행을 15만 번 고쳐 써서 표가 17배로 부푼다
-- (레시피 실제 15MB → 262MB). 실서비스는 활동이 시간에 걸쳐 쌓이고 autovacuum이 공간을 회수하므로,
-- 다시 압축해 그 상태에 맞춘다. 압축하지 않으면 전체를 읽는 쿼리가 실제보다 느리게 측정된다.
-- 게시글(좋아요·댓글 수)과 프로필(팔로워 수)도 같은 이유로 압축한다.
vacuum full analyze public.recipes, public.combos, public.posts, public.profiles;

-- 통계를 새로 모아 쿼리 계획이 실제 데이터 양을 반영하게 한다.
vacuum analyze auth.users, public.comments,
  public.recipe_likes, public.recipe_bookmarks, public.combo_likes, public.combo_bookmarks,
  public.post_likes, public.post_bookmarks, public.user_follows;

select 'users' as what, count(*) from auth.users where email like '%@loadtest.test'
union all select 'recipes', count(*) from public.recipes
union all select 'combos', count(*) from public.combos
union all select 'recipe_likes', count(*) from public.recipe_likes
union all select 'recipe_bookmarks', count(*) from public.recipe_bookmarks
union all select 'combo_likes', count(*) from public.combo_likes
union all select 'combo_bookmarks', count(*) from public.combo_bookmarks
union all select 'comments', count(*) from public.comments
union all select 'posts', count(*) from public.posts
union all select 'post_likes', count(*) from public.post_likes
union all select 'post_bookmarks', count(*) from public.post_bookmarks
union all select 'user_follows', count(*) from public.user_follows;
