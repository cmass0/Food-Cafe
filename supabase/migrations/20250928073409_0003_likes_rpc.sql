-- RPC helpers for likes and view counts (recipes/posts)
-- Designed for use via Supabase RPC endpoints.

begin;

create or replace function public.recipe_increment_view(p_recipe_id uuid)
returns public.recipes
language sql
security definer
set search_path = public
as $$
  update public.recipes
     set view_count = view_count + 1,
         updated_at = now()
   where id = p_recipe_id
  returning *;
$$;

create or replace function public.recipe_adjust_like(p_recipe_id uuid, p_delta int)
returns public.recipes
language sql
security definer
set search_path = public
as $$
  update public.recipes
     set like_count = greatest(like_count + p_delta, 0),
         updated_at = now()
   where id = p_recipe_id
  returning *;
$$;

create or replace function public.post_adjust_like(p_post_id uuid, p_delta int)
returns public.posts
language sql
security definer
set search_path = public
as $$
  update public.posts
     set like_count = greatest(like_count + p_delta, 0),
         updated_at = now()
   where id = p_post_id
  returning *;
$$;

commit;
;
