-- 레시피 작성자 이메일 복사본은 화면에서 쓰지 않으면서 공개 조회·목록 API·조회수 RPC로 노출됐다.
-- 인증 이메일의 원본은 auth.users에 있으므로 콘텐츠 테이블에는 저장하지 않는다.

-- 조회수 RPC가 레시피 행 전체(returning *)를 익명 사용자에게 돌려주지 않도록
-- 게시글·조합 RPC와 같이 증가한 조회수만 반환한다. 반환 타입이 바뀌어 다시 만든다.
drop function public.increment_recipe_view(uuid);

alter table public.recipes drop column writer_email;

create function public.increment_recipe_view(p_recipe_id uuid)
returns integer
language sql
security definer
set search_path to ''
as $function$
  update public.recipes
  set view_count = view_count + 1
  where id = p_recipe_id
  returning view_count;
$function$;

revoke all on function public.increment_recipe_view(uuid) from public;
grant execute on function public.increment_recipe_view(uuid) to anon, authenticated, service_role;
