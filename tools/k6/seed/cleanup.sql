-- bulk-data.sql로 넣은 부하 테스트 데이터를 지운다. 로컬 Supabase DB에서만 실행한다.
-- 부하 테스트 사용자를 지우면 그 사용자가 쓴 레시피·조합·댓글·좋아요·북마크가 CASCADE로 함께 지워진다.
begin;
delete from auth.users where email like '%@loadtest.test';
commit;

vacuum analyze auth.users, public.profiles, public.recipes, public.combos, public.posts, public.comments,
  public.recipe_likes, public.recipe_bookmarks, public.combo_likes, public.combo_bookmarks,
  public.post_likes, public.post_bookmarks, public.user_follows;

select 'recipes' as what, count(*) from public.recipes
union all select 'combos', count(*) from public.combos
union all select 'posts', count(*) from public.posts
union all select 'comments', count(*) from public.comments;
