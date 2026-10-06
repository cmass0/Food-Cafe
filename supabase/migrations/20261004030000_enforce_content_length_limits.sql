-- 콘텐츠 길이·크기 상한을 DB에서도 강제한다.
--
-- 로그인 사용자는 앱 서버를 거치지 않고 Supabase API로 자기 글의 컬럼을 직접 쓸 수 있다(컬럼 단위 권한 + RLS).
-- 지금까지 길이 규칙은 앱 코드(Zod)에만 있어서, 직접 쓰면 수 MB짜리 본문도 저장됐다.
-- 그런 글은 열릴 때마다 서버가 거대한 HTML을 정제하느라 느려진다(서버를 느리게 만드는 공격).
-- 앱 규칙과 같은 숫자로 막아, 앱을 거치든 직접 쓰든 같은 선에서 거절한다.
--
-- 본문 JSON·HTML만 앱 상한(20만 자)의 1.5배로 둔다. DB의 jsonb는 띄어쓰기를 넣은 모양으로 다시 쓰이고
-- 정제는 속성을 덧붙이기도 해서, 앱에서 통과한 글이 DB에서 몇 % 길어질 수 있기 때문이다.
-- 정확한 상한은 앱이 검사하고, DB는 남용을 막는 바깥 안전선이다.

alter table public.posts
  add constraint posts_title_length check (char_length(title) <= 150),
  add constraint posts_content_json_size check (char_length(content_json::text) <= 300000),
  add constraint posts_content_html_size check (char_length(content_html) <= 300000),
  add constraint posts_content_text_size check (char_length(content_text) <= 200000);

comment on constraint posts_title_length on public.posts is
  '게시글 제목 150자 이하. 앱 규칙(domain/post/schema.ts POST_TITLE_MAX_CHARS)과 같은 값.';
comment on constraint posts_content_json_size on public.posts is
  '본문 JSON 크기 상한. 앱 상한 20만 자의 1.5배(jsonb 표기 차이 여유). 직접 쓰기로 거대한 본문을 넣는 것을 막는다.';
comment on constraint posts_content_html_size on public.posts is
  '본문 HTML 크기 상한. 앱 상한 20만 자의 1.5배(정제 시 속성 추가 여유). 보여 줄 때마다 정제하는 비용을 묶는다.';
comment on constraint posts_content_text_size on public.posts is
  '검색용 본문 텍스트 상한. 본문 JSON 상한(20만 자)을 넘을 수 없다.';

alter table public.comments
  add constraint comments_content_length check (char_length(content) <= 1000);

comment on constraint comments_content_length on public.comments is
  '댓글 1000자 이하. 앱 규칙(domain/comment/schema.ts)과 같은 값.';

alter table public.recipes
  add constraint recipes_title_length check (char_length(title) <= 200),
  add constraint recipes_summary_length check (char_length(summary) <= 500),
  add constraint recipes_chef_tip_length check (char_length(chef_tip) <= 500),
  add constraint recipes_difficulty_length check (char_length(difficulty) <= 50),
  add constraint recipes_steps_count check (jsonb_typeof(steps) <> 'array' or jsonb_array_length(steps) <= 50),
  add constraint recipes_steps_size check (char_length(steps::text) <= 160000),
  add constraint recipes_ingredients_size check (char_length(ingredients::text) <= 600000);

comment on constraint recipes_title_length on public.recipes is '레시피 제목 200자 이하. 앱 규칙(domain/recipe/schema.ts)과 같은 값.';
comment on constraint recipes_summary_length on public.recipes is '레시피 요약 500자 이하. 앱 규칙과 같은 값.';
comment on constraint recipes_chef_tip_length on public.recipes is '셰프의 팁 500자 이하. 앱 규칙과 같은 값.';
comment on constraint recipes_difficulty_length on public.recipes is '난이도 50자 이하. 앱 규칙과 같은 값.';
comment on constraint recipes_steps_count on public.recipes is
  '조리 단계 50개 이하. 앱 규칙(domain/recipe/schema.ts MAX_RECIPE_STEPS)과 같은 값.';
comment on constraint recipes_steps_size on public.recipes is
  '조리 단계 JSON 크기 상한(남용 방지 안전선). JSON 글자로 세므로 따옴표는 2자, 제어 문자는 6자(\uXXXX)로 늘어난다. 앱이 허용하는 가장 긴 저장 형태(50단계 × 500자 × 6배 ≈ 15.1만 자)도 받도록 16만 자. 단계별 500자는 앱이 검사한다.';
comment on constraint recipes_ingredients_size on public.recipes is
  '재료 JSON 크기 상한(남용 방지 안전선). 앱이 허용하는 가장 긴 저장 형태(재료 200개 × 항목 최대 450자 × 6배 ≈ 55만 자)도 받도록 60만 자. 개수·항목 길이는 앱이 검사한다.';

alter table public.combos
  add constraint combos_title_length check (char_length(title) <= 200),
  add constraint combos_summary_length check (char_length(summary) <= 500),
  add constraint combos_difficulty_length check (char_length(difficulty) <= 50),
  add constraint combos_items_size check (char_length(items::text) <= 300000),
  add constraint combos_steps_count check (jsonb_typeof(steps) <> 'array' or jsonb_array_length(steps) <= 50),
  add constraint combos_steps_size check (char_length(steps::text) <= 160000);

comment on constraint combos_title_length on public.combos is '조합 제목 200자 이하. 앱 규칙(domain/combo/schema.ts)과 같은 값.';
comment on constraint combos_summary_length on public.combos is '조합 요약 500자 이하. 앱 규칙과 같은 값.';
comment on constraint combos_difficulty_length on public.combos is '난이도 50자 이하. 앱 규칙과 같은 값.';
comment on constraint combos_items_size on public.combos is
  '조합 항목 JSON 크기 상한(남용 방지 안전선). 앱이 허용하는 가장 긴 저장 형태(항목 10개 × 제목·요약·이미지 경로 최대 × 6배 ≈ 17만 자)보다 넉넉하다. 개수·항목 길이는 앱이 검사한다.';
comment on constraint combos_steps_size on public.combos is
  '조합 단계 JSON 크기 상한(남용 방지 안전선). 레시피 단계와 같은 기준(50단계 × 500자 × 6배 ≈ 15.1만 자)으로 16만 자. 단계별 500자는 앱이 검사한다.';
comment on constraint combos_steps_count on public.combos is
  '조합 단계 50개 이하. 앱 규칙(domain/combo/schema.ts MAX_COMBO_STEPS)과 같은 값.';
