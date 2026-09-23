-- 앱에서 사용하지 않는 조합-레시피 참조 테이블을 제거한다. 조합 구성은 combos.items(JSON)에 저장한다.
drop table public.combo_recipe_ref;

-- 팔로워·팔로잉 수는 컬럼 UPDATE 권한(display_name, photo_url만 허용)으로 사용자가 수정할 수 없으므로
-- 값을 되돌리던 보호 트리거는 더 이상 필요 없다. 카운터 갱신은 trg_user_follows_sync_count가 담당한다.
drop trigger trg_profiles_preserve_follow_counts on public.profiles;
drop function public.preserve_follow_counters();
