-- 트리거 이름 규칙: trg_<테이블>_<하는 일>
-- (auth.users의 on_auth_user_created는 Supabase 인증 시스템 소유 테이블이라 제외한다.)

-- 1. updated_at은 사용자가 수정할 수 있는 컬럼(컬럼 UPDATE 권한 목록)이 SET에 있을 때만 갱신한다.
-- 조회수·좋아요·북마크·댓글 수처럼 시스템이 카운터를 바꾸는 UPDATE는 수정으로 기록하지 않는다.
drop trigger trg_recipes_updated on public.recipes;
create trigger trg_recipes_set_updated_at
before update of
  title, summary, chef_tip, steps, ingredients, image, images, category,
  tags, tools, tools_required, difficulty, time_minutes, servings
on public.recipes
for each row execute function public.set_updated_at();

drop trigger combos_updated_at on public.combos;
create trigger trg_combos_set_updated_at
before update of
  title, summary, steps, items, tags, tools, tools_required,
  difficulty, time_minutes, image
on public.combos
for each row execute function public.set_updated_at();

-- 조회수만 예외 처리하던 게시글 전용 함수는 컬럼 조건으로 대체한다.
drop trigger posts_updated_at on public.posts;
drop function public.handle_posts_updated_at();
create trigger trg_posts_set_updated_at
before update of
  title, category, content_json, content_html, content_text
on public.posts
for each row execute function public.set_updated_at();

create trigger trg_comments_set_updated_at_new
before update of content, deleted_at
on public.comments
for each row execute function public.set_updated_at();
drop trigger trg_comments_updated on public.comments;
alter trigger trg_comments_set_updated_at_new on public.comments rename to trg_comments_set_updated_at;

alter trigger profiles_set_updated_at on public.profiles
  rename to trg_profiles_set_updated_at;
alter trigger recommendation_documents_set_updated_at on private.recommendation_documents
  rename to trg_recommendation_documents_set_updated_at;

-- 2. 같은 함수를 부르던 댓글 수 트리거 3개를 하나로 합친다.
drop trigger trg_comments_after_insert on public.comments;
drop trigger trg_comments_after_delete on public.comments;
drop trigger trg_comments_after_update on public.comments;
create trigger trg_comments_sync_parent_count
after insert or delete or update of deleted_at on public.comments
for each row execute function private.sync_comment_parent_count();

-- 3. 나머지 트리거는 동작을 바꾸지 않고 이름만 규칙에 맞춘다.
alter trigger recipes_set_writer on public.recipes rename to trg_recipes_set_writer;
alter trigger posts_set_writer on public.posts rename to trg_posts_set_writer;
alter trigger combos_set_writer on public.combos rename to trg_combos_set_writer;
alter trigger comments_set_writer on public.comments rename to trg_comments_set_writer;

alter trigger recipes_delete_recommendation_document on public.recipes
  rename to trg_recipes_delete_recommendation_document;
alter trigger combos_delete_recommendation_document on public.combos
  rename to trg_combos_delete_recommendation_document;

alter trigger post_likes_sync_count on public.post_likes rename to trg_post_likes_sync_count;
alter trigger post_bookmarks_sync_count on public.post_bookmarks rename to trg_post_bookmarks_sync_count;
alter trigger recipe_likes_sync_count on public.recipe_likes rename to trg_recipe_likes_sync_count;
alter trigger recipe_bookmarks_sync_count on public.recipe_bookmarks rename to trg_recipe_bookmarks_sync_count;
alter trigger combo_likes_sync_count on public.combo_likes rename to trg_combo_likes_sync_count;
alter trigger combo_bookmarks_sync_count on public.combo_bookmarks rename to trg_combo_bookmarks_sync_count;
alter trigger user_follows_sync_count on public.user_follows rename to trg_user_follows_sync_count;
alter trigger profiles_preserve_follow_counts on public.profiles
  rename to trg_profiles_preserve_follow_counts;
