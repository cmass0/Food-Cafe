-- Drop legacy columns from recipes (keep recipe/content as-is)
begin;

alter table public.recipes
  drop column if exists id_text_old,
  drop column if exists legacy_id,
  drop column if exists writer_uid_legacy,
  drop column if exists images;

commit;
