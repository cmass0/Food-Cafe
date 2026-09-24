-- DB 객체 이름과 형식을 규칙에 맞춘다. 앱이 호출하는 RPC·테이블·컬럼은 바꾸지 않는다.
--   트리거 함수: private 스키마, sync_*/set_* 이름, search_path = ''
--   인덱스: idx_<테이블>_<컬럼>, 중복·상위 인덱스에 포함된 인덱스 삭제
--   정책: <테이블>_<명령>_<범위>, auth.uid()는 (select auth.uid())로 한 번만 평가
-- recipe_bookmarks의 인덱스·제약 이름은 구조 정리 단계에서 함께 바꾼다.

-- 1. 트리거 함수 -------------------------------------------------------------
-- ALTER FUNCTION은 함수 oid를 유지하므로 연결된 트리거를 다시 만들 필요가 없다.

alter function public.adjust_content_engagement_counter() set schema private;
alter function private.adjust_content_engagement_counter() rename to sync_engagement_count;
alter function private.sync_engagement_count() set search_path = '';

alter function private.adjust_follow_counters() rename to sync_follow_count;

alter function public.set_updated_at() set schema private;

alter function private.delete_recommendation_document_for_source()
  rename to delete_recommendation_document;

revoke all on function
  private.sync_engagement_count(),
  private.sync_follow_count(),
  private.set_updated_at(),
  private.delete_recommendation_document()
from public, anon, authenticated;

-- uuid_v7은 recipes.id 기본값에만 쓰였다. 정렬은 created_at으로 하므로 다른 테이블과 같은 기본값으로 맞춘다.
alter table public.recipes alter column id set default gen_random_uuid();
drop function public.uuid_v7();

-- 2. 제약조건 ----------------------------------------------------------------

-- recipes.writer_uid에 FK가 두 개였다(auth.users CASCADE, profiles SET NULL). 다른 콘텐츠 테이블과 같이 auth.users 하나만 남긴다.
alter table public.recipes drop constraint recipes_writer_fk;

-- recipe_likes: 기본키와 똑같은 유니크 제약을 지우고, 옛 테이블 이름(user_likes)을 바꾼다.
alter table public.recipe_likes drop constraint user_likes_user_recipe_unique;
alter table public.recipe_likes rename constraint user_likes_pkey to recipe_likes_pkey;
alter table public.recipe_likes rename constraint user_likes_recipe_id_fkey to recipe_likes_recipe_id_fkey;
alter table public.recipe_likes rename constraint user_likes_user_id_fkey to recipe_likes_user_id_fkey;

alter table public.profiles rename constraint profiles_auth_user_fkey to profiles_id_fkey;
alter table public.user_follows rename constraint user_follows_check to user_follows_no_self_follow;

-- 3. 인덱스 ------------------------------------------------------------------

-- 기본키 (user_id, …) 또는 (writer_uid, created_at) 인덱스가 이미 포함한다.
drop index public.idx_user_likes_user;
drop index public.idx_comments_author_id;
-- idx_recipe_likes_recent_trending (created_at desc, recipe_id, user_id)가 대신한다.
drop index public.index_user_likes_created_at_recipe;

-- 부모 FK 인덱스: combo_likes·combo_bookmarks와 같은 (부모 id, created_at desc) 형태로 맞춘다.
drop index public.idx_user_likes_recipe;
create index idx_recipe_likes_recipe on public.recipe_likes (recipe_id, created_at desc);
create index idx_post_likes_post on public.post_likes (post_id, created_at desc);
create index idx_post_bookmarks_post on public.post_bookmarks (post_id, created_at desc);

-- 작성자 FK 인덱스: posts에만 있던 것을 recipes·combos에도 둔다.
create index idx_recipes_writer_uid on public.recipes (writer_uid);
create index idx_combos_writer_uid on public.combos (writer_uid);

-- 목록 정렬 인덱스: posts·combos와 같게 recipes에도 둔다.
create index idx_recipes_created_at on public.recipes (created_at desc, id);

alter index public.combos_tsv_gin rename to idx_combos_tsv;
alter index public.posts_tsv_gin rename to idx_posts_tsv;
alter index public.idx_combos_tags_gin rename to idx_combos_tags;
alter index public.idx_recipes_tags_gin rename to idx_recipes_tags;
alter index public.posts_category_created_at_id_idx rename to idx_posts_category_created_at;
alter index public.recipes_category_idx rename to idx_recipes_category;
alter index public.user_follows_following_id_idx rename to idx_user_follows_following_id;
alter index private.recommendation_documents_ingredient_names_idx
  rename to idx_recommendation_documents_ingredient_names;
alter index private.recommendation_documents_pending_idx
  rename to idx_recommendation_documents_pending;
alter index private.recommendation_documents_search_vector_idx
  rename to idx_recommendation_documents_search_vector;

-- 4. RLS 정책 ----------------------------------------------------------------

alter policy insert_recipes_for_owner on public.recipes rename to recipes_insert_own;
alter policy recipes_insert_own on public.recipes
  with check ((select auth.uid()) = writer_uid);

alter policy recipes_select_all on public.recipes rename to recipes_select_public;
alter policy posts_select_all on public.posts rename to posts_select_public;
alter policy combos_select_all on public.combos rename to combos_select_public;
alter policy comments_select_all on public.comments rename to comments_select_public;
alter policy recipes_select_public on public.recipes to anon, authenticated;
alter policy posts_select_public on public.posts to anon, authenticated;
alter policy combos_select_public on public.combos to anon, authenticated;
alter policy comments_select_public on public.comments to anon, authenticated;

alter policy combos_insert_own on public.combos
  with check ((select auth.uid()) = writer_uid);
alter policy comments_insert_own on public.comments
  with check ((select auth.uid()) = writer_uid);
alter policy comments_update_own on public.comments
  using ((select auth.uid()) = writer_uid)
  with check ((select auth.uid()) = writer_uid);

alter policy post_likes_select_own on public.post_likes using ((select auth.uid()) = user_id);
alter policy post_likes_insert_own on public.post_likes with check ((select auth.uid()) = user_id);
alter policy post_likes_delete_own on public.post_likes using ((select auth.uid()) = user_id);
alter policy combo_likes_select_own on public.combo_likes using ((select auth.uid()) = user_id);
alter policy combo_likes_insert_own on public.combo_likes with check ((select auth.uid()) = user_id);
alter policy combo_likes_delete_own on public.combo_likes using ((select auth.uid()) = user_id);
alter policy post_bookmarks_select_own on public.post_bookmarks using ((select auth.uid()) = user_id);
alter policy post_bookmarks_insert_own on public.post_bookmarks with check ((select auth.uid()) = user_id);
alter policy post_bookmarks_delete_own on public.post_bookmarks using ((select auth.uid()) = user_id);
alter policy recipe_bookmarks_select_own on public.recipe_bookmarks using ((select auth.uid()) = user_id);
alter policy recipe_bookmarks_insert_own on public.recipe_bookmarks with check ((select auth.uid()) = user_id);
alter policy recipe_bookmarks_delete_own on public.recipe_bookmarks using ((select auth.uid()) = user_id);
alter policy combo_bookmarks_select_own on public.combo_bookmarks using ((select auth.uid()) = user_id);
alter policy combo_bookmarks_insert_own on public.combo_bookmarks with check ((select auth.uid()) = user_id);
alter policy combo_bookmarks_delete_own on public.combo_bookmarks using ((select auth.uid()) = user_id);

-- 5. 확장 --------------------------------------------------------------------
-- pg_trgm은 recipes.title 인덱스의 연산자 클래스로만 쓰이며, 인덱스는 oid로 참조하므로 그대로 동작한다.
alter extension pg_trgm set schema extensions;
