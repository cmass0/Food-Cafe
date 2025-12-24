create table public.user_follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index on public.user_follows (following_id);

alter table public.user_follows enable row level security;

create policy "follow read" on public.user_follows
for select using (true);

create policy "follow insert" on public.user_follows
for insert with check (auth.uid() = follower_id and follower_id <> following_id);

create policy "follow delete" on public.user_follows
for delete using (auth.uid() = follower_id);

create or replace function public.toggle_follow(p_target_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$

declare
  v_follower uuid := auth.uid();
  v_insert boolean;
  v_delete boolean;
begin
  if v_follower is null then raise exception 'not authenticated'; end if; 
  if v_follower = p_target_id then raise exception 'cannot follow self'; end if;

  -- insert 
  insert into public.user_follows (follower_id, following_id)
  values (v_follower, p_target_id)
  on conflict do nothing
  returning true into v_insert;

  -- insert후 카운트 증가

    if v_insert then
      update public.users 
      set follower_count = follower_count + 1
      where id = p_target_id;

      update public.users
      set following_count  = following_count + 1
      where id = v_follower;

      return true;
  end if;

  -- delete
  delete from public.user_follows
  where follower_id = v_follower and following_id = p_target_id
  returning true into v_delete;

  -- delete후 카운트 감소
  if v_delete then
    update public.users 
      set follower_count = greatest(follower_count  - 1, 0)
    where id = p_target_id;

    update public.users
      set following_count  = greatest(following_count -1, 0)
    where id = v_follower;

  end if;

  return false;
end $$;