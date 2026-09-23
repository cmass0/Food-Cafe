-- 사용자 쓰기 권한을 컬럼 단위로 제한한다.
-- RLS는 "어느 행"을, 컬럼 권한은 "그 행의 어느 컬럼"을 쓸 수 있는지 정한다.
-- 카운터·작성자·생성 시각 같은 시스템 관리 컬럼은 허용 목록에 넣지 않아 사용자가 직접 쓸 수 없다.
-- 카운터 갱신은 SECURITY DEFINER Trigger·RPC가 담당하므로 이 권한의 영향을 받지 않는다.

-- 1. Supabase 기본값으로 열려 있던 테이블 전체 쓰기 권한을 회수한다.
-- TRUNCATE는 RLS를 적용받지 않으므로 앱 역할에 남겨 두지 않는다.
revoke insert, update, delete, truncate, references, trigger
  on table public.recipes, public.posts, public.combos, public.combo_recipe_ref
  from anon, authenticated;

revoke insert on table public.comments from authenticated;

-- 2. 작성자·관리자 삭제는 기존 RLS 정책이 판정하므로 로그인 사용자의 DELETE만 다시 연다.
grant delete on table public.recipes, public.posts, public.combos to authenticated;

-- 3. 앱이 생성 시 보내는 컬럼만 INSERT를 허용한다(각 도메인 insert 스키마·서비스 payload 기준).
-- writer_uid는 RLS WITH CHECK가 auth.uid()와 같은지 검사한다.
grant insert (
  id, title, summary, chef_tip, steps, ingredients, image, images, category,
  tags, tools, tools_required, difficulty, time_minutes, servings,
  writer_uid, writer_name, writer_email
) on table public.recipes to authenticated;

grant insert (
  id, title, category, content_json, content_html, content_text,
  writer_uid, writer_name
) on table public.posts to authenticated;

grant insert (
  id, title, summary, steps, items, tags, tools, tools_required,
  difficulty, time_minutes, image, writer_uid, writer_name
) on table public.combos to authenticated;

grant insert (
  post_id, recipe_id, combo_id, content, writer_uid, writer_name
) on table public.comments to authenticated;

-- 4. 앱이 수정 시 보내는 컬럼만 UPDATE를 허용한다(각 도메인 update 스키마·서비스 payload 기준).
grant update (
  title, summary, chef_tip, steps, ingredients, image, images, category,
  tags, tools, tools_required, difficulty, time_minutes, servings
) on table public.recipes to authenticated;

grant update (
  title, category, content_json, content_html, content_text
) on table public.posts to authenticated;

grant update (
  title, summary, steps, items, tags, tools, tools_required,
  difficulty, time_minutes, image
) on table public.combos to authenticated;

-- 5. 카운터를 되돌리던 보호 Trigger는 컬럼 권한으로 대체되어 제거한다.
-- 이 Trigger는 comment_count를 빠뜨려 작성자가 댓글 수를 바꿀 수 있었다.
drop trigger recipes_preserve_engagement_counts on public.recipes;
drop trigger posts_preserve_engagement_counts on public.posts;
drop trigger combos_preserve_engagement_counts on public.combos;
drop function public.preserve_content_engagement_counters();
