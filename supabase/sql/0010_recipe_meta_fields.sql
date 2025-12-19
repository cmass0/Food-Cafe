-- Add recipe metadata fields if missing
alter table public.recipes
  add column if not exists difficulty text,
  add column if not exists time_minutes integer,
  add column if not exists servings integer;
