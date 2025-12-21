begin;

create or replace function public.recipe_toggle_like(p_recipe_id uuid)
returns table (liked boolean, like_count int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_delta int := 0;
  v_like_count int;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  insert into public.user_likes(user_id, recipe_id)
  values (v_user_id, p_recipe_id)
  on conflict do nothing;

  if found then
    v_delta := 1;
  else
    delete from public.user_likes
     where user_id = v_user_id and recipe_id = p_recipe_id;

    v_delta := case when found then -1 else 0 end;
  end if;

  update public.recipes
     set like_count = greatest(public.recipes.like_count + v_delta, 0),
         updated_at = now()
   where id = p_recipe_id
  returning public.recipes.like_count into v_like_count;

  like_count := v_like_count;

  select exists (
    select 1 from public.user_likes
     where user_id = v_user_id and recipe_id = p_recipe_id
  ) into liked;

  return next;
end $$;

commit;
