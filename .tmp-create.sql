create table if not exists public.aaa (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default timezone('utc', now())
);
