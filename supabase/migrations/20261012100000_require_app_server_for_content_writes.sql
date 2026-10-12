-- 게시글·레시피·조합의 작성·수정·삭제는 앱 서버를 거친 요청만 받는다.
--
-- 로그인 사용자는 공개 키와 자기 토큰으로 Supabase API를 직접 부를 수 있어서, 앱 서버를 건너뛰고 자기 글을
-- 쓰고 지울 수 있었다. 그러면 서버에서만 하는 일이 빠진다.
--   - 게시글: 멘션 대상 확인(팔로우한 사람만, 최대 20명), 검색·미리보기용 글자(content_text) 추출
--   - 레시피·조합: AI 추천 색인 갱신
--   - 삭제: 글에 딸린 Storage 사진 정리
-- 글자 수·개수 같은 값의 범위는 CHECK 제약이 막지만, 이런 규칙은 DB가 대신 검사할 수 없다.
--
-- 앱 서버는 요청마다 서버만 아는 값을 x-app-server-key 헤더로 보낸다(src/lib/supabase/server.ts).
-- PostgREST는 요청 헤더를 request.headers(JSON)로 넘기므로, 쓰기 정책이 그 값을 Vault의 app_server_key와 비교한다.
-- 서버 요청도 사용자 토큰을 그대로 쓰므로 "내 글인지"는 지금처럼 RLS가 확인한다. service role로 RLS를 건너뛰지 않는다.
-- 헤더가 없거나 다르거나 Vault에 값이 없으면 쓰기를 거절한다(fail-closed).
--
-- 비밀값은 이 파일에 넣지 않는다. 로컬은 supabase/seed.sql이 넣고, 원격은 배포할 때
-- vault.create_secret('<값>', 'app_server_key')로 넣고 서버 환경변수 SUPABASE_APP_SERVER_KEY에 같은 값을 둔다.

create function private.is_app_server()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (nullif(current_setting('request.headers', true), '')::json ->> 'x-app-server-key')
      = (
        select secret.decrypted_secret
        from vault.decrypted_secrets as secret
        where secret.name = 'app_server_key'
      ),
    false
  );
$$;

comment on function private.is_app_server() is
  '요청의 x-app-server-key 헤더가 Vault의 app_server_key와 같으면 true. 앱 서버를 거친 요청인지 콘텐츠 쓰기 정책이 확인한다. 헤더·Vault 값이 없으면 false. 로그인 사용자는 Vault를 읽지 못하므로 security definer로 비교만 대신한다.';

revoke execute on function private.is_app_server() from public;
grant execute on function private.is_app_server() to authenticated;

-- 수정은 WITH CHECK에서 거절해 직접 요청이 오류로 드러나게 한다. 삭제는 USING뿐이라 0행으로 끝난다.

alter policy posts_insert_own_or_admin on public.posts
  with check (
    (select private.is_app_server())
    and (((select auth.uid()) = writer_uid) or (select private.is_admin()))
  );

alter policy posts_update_own on public.posts
  using ((select auth.uid()) = writer_uid)
  with check ((select private.is_app_server()) and (select auth.uid()) = writer_uid);

alter policy posts_delete_own_or_admin on public.posts
  using (
    (select private.is_app_server())
    and (((select auth.uid()) = writer_uid) or (select private.is_admin()))
  );

alter policy recipes_insert_own on public.recipes
  with check ((select private.is_app_server()) and (select auth.uid()) = writer_uid);

alter policy recipes_update_own on public.recipes
  using ((select auth.uid()) = writer_uid)
  with check ((select private.is_app_server()) and (select auth.uid()) = writer_uid);

alter policy recipes_delete_own_or_admin on public.recipes
  using (
    (select private.is_app_server())
    and (((select auth.uid()) = writer_uid) or (select private.is_admin()))
  );

alter policy combos_insert_own on public.combos
  with check ((select private.is_app_server()) and (select auth.uid()) = writer_uid);

alter policy combos_update_own on public.combos
  using ((select auth.uid()) = writer_uid)
  with check ((select private.is_app_server()) and (select auth.uid()) = writer_uid);

alter policy combos_delete_own_or_admin on public.combos
  using (
    (select private.is_app_server())
    and (((select auth.uid()) = writer_uid) or (select private.is_admin()))
  );

comment on policy posts_insert_own_or_admin on public.posts is
  '앱 서버를 거친 요청(private.is_app_server)이고 작성자가 본인이거나 관리자일 때만 게시글을 만든다.';
comment on policy posts_update_own on public.posts is
  '앱 서버를 거친 요청으로 본인 게시글만 고친다. 직접 API 요청은 WITH CHECK에서 오류로 거절된다.';
comment on policy posts_delete_own_or_admin on public.posts is
  '앱 서버를 거친 요청으로 본인 또는 관리자만 게시글을 지운다. 서버가 딸린 Storage 사진도 함께 정리한다.';
comment on policy recipes_insert_own on public.recipes is
  '앱 서버를 거친 요청(private.is_app_server)으로 본인 레시피만 만든다. 서버가 AI 추천 색인도 함께 갱신한다.';
comment on policy recipes_update_own on public.recipes is
  '앱 서버를 거친 요청으로 본인 레시피만 고친다. 직접 API 요청은 WITH CHECK에서 오류로 거절된다.';
comment on policy recipes_delete_own_or_admin on public.recipes is
  '앱 서버를 거친 요청으로 본인 또는 관리자만 레시피를 지운다. 서버가 딸린 Storage 사진도 함께 정리한다.';
comment on policy combos_insert_own on public.combos is
  '앱 서버를 거친 요청(private.is_app_server)으로 본인 조합만 만든다. 서버가 AI 추천 색인도 함께 갱신한다.';
comment on policy combos_update_own on public.combos is
  '앱 서버를 거친 요청으로 본인 조합만 고친다. 직접 API 요청은 WITH CHECK에서 오류로 거절된다.';
comment on policy combos_delete_own_or_admin on public.combos is
  '앱 서버를 거친 요청으로 본인 또는 관리자만 조합을 지운다. 서버가 딸린 Storage 사진도 함께 정리한다.';
