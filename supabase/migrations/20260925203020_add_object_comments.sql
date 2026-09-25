-- 설명이 없던 함수·테이블에 설명(comment)을 붙인다. 동작은 바꾸지 않는다.
-- 형식: 무엇을 하는지 + 호출 주체·권한 상승 이유 같은 알아야 할 제약.

-- 1. API 함수 (public) ------------------------------------------------------------

comment on function public.set_recipe_like(uuid, boolean) is
  '로그인 사용자의 레시피 좋아요를 p_liked 상태로 맞추고 현재 상태와 좋아요 수를 반환한다. 같은 요청을 반복해도 결과가 같고 대상이 없으면 빈 결과. 좋아요 테이블에 직접 쓰기 권한이 없어 SECURITY DEFINER로 대신 쓴다.';
comment on function public.set_post_like(uuid, boolean) is
  '로그인 사용자의 게시글 좋아요를 p_liked 상태로 맞추고 현재 상태와 좋아요 수를 반환한다. 같은 요청을 반복해도 결과가 같고 대상이 없으면 빈 결과. 좋아요 테이블에 직접 쓰기 권한이 없어 SECURITY DEFINER로 대신 쓴다.';
comment on function public.set_combo_like(uuid, boolean) is
  '로그인 사용자의 조합 좋아요를 p_liked 상태로 맞추고 현재 상태와 좋아요 수를 반환한다. 같은 요청을 반복해도 결과가 같고 대상이 없으면 빈 결과. 좋아요 테이블에 직접 쓰기 권한이 없어 SECURITY DEFINER로 대신 쓴다.';
comment on function public.set_recipe_bookmark(uuid, boolean) is
  '로그인 사용자의 레시피 북마크를 p_bookmarked 상태로 맞추고 현재 상태와 북마크 수를 반환한다. 같은 요청을 반복해도 결과가 같고 대상이 없으면 빈 결과. 북마크 테이블에 직접 쓰기 권한이 없어 SECURITY DEFINER로 대신 쓴다.';
comment on function public.set_post_bookmark(uuid, boolean) is
  '로그인 사용자의 게시글 북마크를 p_bookmarked 상태로 맞추고 현재 상태와 북마크 수를 반환한다. 같은 요청을 반복해도 결과가 같고 대상이 없으면 빈 결과. 북마크 테이블에 직접 쓰기 권한이 없어 SECURITY DEFINER로 대신 쓴다.';
comment on function public.set_combo_bookmark(uuid, boolean) is
  '로그인 사용자의 조합 북마크를 p_bookmarked 상태로 맞추고 현재 상태와 북마크 수를 반환한다. 같은 요청을 반복해도 결과가 같고 대상이 없으면 빈 결과. 북마크 테이블에 직접 쓰기 권한이 없어 SECURITY DEFINER로 대신 쓴다.';
comment on function public.set_follow(uuid, boolean) is
  '로그인 사용자의 팔로우를 p_following 상태로 맞추고 상대의 팔로워 수와 내 팔로잉 수를 반환한다. 자기 자신은 팔로우할 수 없고 대상이 없으면 빈 결과. 팔로우 테이블에 직접 쓰기 권한이 없어 SECURITY DEFINER로 대신 쓴다.';

comment on function public.increment_recipe_view(uuid) is
  '레시피 조회수를 1 올리고 새 값을 반환한다(대상이 없으면 NULL). 비로그인 조회도 세려고 anon 실행을 허용하며, 반복 호출로 늘릴 수 있어 순위 계산에는 쓰지 않는다.';
comment on function public.increment_post_view(uuid) is
  '게시글 조회수를 1 올리고 새 값을 반환한다(대상이 없으면 NULL). 비로그인 조회도 세려고 anon 실행을 허용하며, 반복 호출로 늘릴 수 있어 순위 계산에는 쓰지 않는다.';
comment on function public.increment_combo_view(uuid) is
  '조합 조회수를 1 올리고 새 값을 반환한다(대상이 없으면 NULL). 비로그인 조회도 세려고 anon 실행을 허용하며, 반복 호출로 늘릴 수 있어 순위 계산에는 쓰지 않는다.';

-- 원격 DB에만 있고 마이그레이션에는 없던 설명이다. 로컬·원격을 맞추려고 같은 문구로 다시 적는다.
comment on function public.is_current_user_admin() is
  '현재 인증 사용자가 private.user_roles 기준 관리자인지 반환한다.';

comment on function public.get_recommendation_document_states() is
  '추천 문서의 원본별 내용 해시와 임베딩 상태를 반환한다. 백필 도구가 다시 임베딩할 대상을 고를 때 쓴다. 서버 전용.';
comment on function public.upsert_recommendation_documents(jsonb) is
  '레시피·조합 추천 문서를 한 번에 1~100개 추가하거나 갱신한다. 원본이 없거나 지원하지 않는 종류가 섞이면 전체를 거부한다. 서버 전용.';

-- 2. 내부 함수 (private) ------------------------------------------------------------

comment on function private.is_admin() is
  '현재 로그인 사용자가 private.user_roles에서 관리자 역할인지 반환한다. 콘텐츠 삭제 RLS 정책에서 쓴다.';
comment on function private.trending_window_start(text) is
  '트렌딩 기간(day·week·month)의 시작 시각을 반환한다. 지원하지 않는 기간은 22023 오류. 앱의 기간 라벨(src/features/trending/period.ts)과 같은 간격을 유지한다.';

comment on function private.handle_new_user() is
  '트리거: auth.users에 가입자가 생기면 메타데이터의 이름·사진으로 공개 프로필을 만든다. 이름이 없으면 user-<id 앞 8자>를 쓴다.';
comment on function private.set_content_writer() is
  '트리거: 레시피·조합·게시글·댓글 작성 시 작성자 id를 로그인 사용자로, 작성자 이름을 프로필 이름으로 채운다. 클라이언트가 작성자 이름을 위조할 수 없게 한다.';
comment on function private.set_updated_at() is
  '트리거: 사용자가 수정할 수 있는 컬럼이 바뀔 때만 updated_at을 현재 시각으로 갱신한다. 카운터 변경으로는 바뀌지 않는다.';
comment on function private.sync_engagement_count() is
  '트리거: 좋아요·북마크 행이 생기거나 지워지면 부모 콘텐츠의 개수를 1씩 조정한다. 트리거 인자: 부모 테이블, 부모 id 컬럼, 개수 컬럼.';
comment on function private.sync_follow_count() is
  '트리거: 팔로우 관계가 생기거나 지워지면 양쪽 프로필의 팔로워·팔로잉 수를 조정한다.';
comment on function private.sync_comment_parent_count() is
  '트리거: 댓글 작성·삭제와 소프트 삭제·복구에 맞춰 부모(게시글·레시피·조합)의 comment_count를 조정한다.';
comment on function private.delete_recommendation_document() is
  '트리거: 레시피·조합이 삭제되면 해당 추천 문서를 지운다. 트리거 인자: 원본 종류(recipe·combo).';

-- 3. 테이블 ------------------------------------------------------------------------

comment on table public.profiles is
  '가입자의 공개 프로필. 누구나 조회하므로 비공개 정보는 두지 않는다. 가입 시 private.handle_new_user 트리거가 만든다.';
comment on table public.recipes is
  '사용자가 작성한 레시피. 좋아요·북마크·댓글·조회 수는 트리거와 RPC가 관리하며 사용자가 직접 바꿀 수 없다.';
comment on table public.combos is
  '레시피와 상품을 묶은 조합. 좋아요·북마크·댓글·조회 수는 트리거와 RPC가 관리하며 사용자가 직접 바꿀 수 없다.';
comment on table public.posts is
  '커뮤니티 게시글. 좋아요·북마크·댓글·조회 수는 트리거와 RPC가 관리하며 사용자가 직접 바꿀 수 없다.';
comment on table public.comments is
  '게시글·레시피·조합의 댓글. 부모 FK(post_id·recipe_id·combo_id) 중 정확히 하나만 채우며, 삭제는 deleted_at으로 표시한다.';

comment on table public.recipe_likes is
  '사용자별 레시피 좋아요. 쓰기는 set_recipe_like RPC로만 하고 본인 행만 조회한다.';
comment on table public.post_likes is
  '사용자별 게시글 좋아요. 쓰기는 set_post_like RPC로만 하고 본인 행만 조회한다.';
comment on table public.combo_likes is
  '사용자별 조합 좋아요. 쓰기는 set_combo_like RPC로만 하고 본인 행만 조회한다.';
comment on table public.recipe_bookmarks is
  '사용자별 레시피 북마크. 쓰기는 set_recipe_bookmark RPC로만 하고 본인 행만 조회한다.';
comment on table public.post_bookmarks is
  '사용자별 게시글 북마크. 쓰기는 set_post_bookmark RPC로만 하고 본인 행만 조회한다.';
comment on table public.combo_bookmarks is
  '사용자별 조합 북마크. 쓰기는 set_combo_bookmark RPC로만 하고 본인 행만 조회한다.';
comment on table public.user_follows is
  '사용자 간 팔로우 관계. 누구나 조회하며 쓰기는 set_follow RPC로만 한다. 자기 자신은 팔로우할 수 없다.';

comment on table private.user_roles is
  '관리자 등 사용자 역할. API로 노출하지 않으며 private.is_admin()이 참조한다.';
