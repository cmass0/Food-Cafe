-- 콘텐츠 작성자 id·이름을 DB가 채운다. 클라이언트가 보낸 이름은 쓰지 않는다.
-- 이전에는 writer_name을 요청 값 그대로 저장해, Supabase REST를 직접 호출하면
-- 다른 이름(예: 운영자)으로 글을 쓸 수 있었다.
create or replace function private.set_content_writer()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_display_name text;
begin
  new.writer_uid := coalesce(new.writer_uid, (select auth.uid()));

  -- 작성자가 없는 행은 service_role 전용 시드 데이터뿐이므로 보낸 이름을 유지한다.
  if new.writer_uid is not null then
    select profile.display_name into v_display_name
    from public.profiles as profile
    where profile.id = new.writer_uid;

    -- 가입 Trigger(private.handle_new_user)와 같은 기본 이름 규칙을 쓴다.
    new.writer_name := coalesce(v_display_name, 'user-' || left(new.writer_uid::text, 8));
  end if;

  return new;
end;
$function$;

revoke all on function private.set_content_writer() from public, anon, authenticated, service_role;

-- writer_uid만 채우던 기존 함수 두 개를 공용 함수로 대체한다.
drop trigger trg_recipes_set_writer on public.recipes;
drop trigger tr_comments_set_writer on public.comments;
drop function public.set_writer_uid();
drop function public.comments_set_writer();

create trigger recipes_set_writer
before insert on public.recipes
for each row execute function private.set_content_writer();

create trigger posts_set_writer
before insert on public.posts
for each row execute function private.set_content_writer();

create trigger combos_set_writer
before insert on public.combos
for each row execute function private.set_content_writer();

create trigger comments_set_writer
before insert on public.comments
for each row execute function private.set_content_writer();

-- 이름은 DB가 채우므로 사용자는 더 이상 보낼 수 없다.
revoke insert (writer_name) on table public.recipes, public.posts, public.combos, public.comments
  from authenticated;
