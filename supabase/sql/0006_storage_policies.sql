-- ===============================================================
-- Storage RLS policies for bucket 'food-cafe'
-- DRY-safe version (no IF NOT EXISTS). Drop then Create.
-- UUID regex is strict (with hyphen positions) to avoid ::uuid cast errors.
-- ===============================================================

begin;

-- UUID regex piece used below:
--   ^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/
--   ^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/

-- ---------------------------------------------------------------
-- INSERT (업로드) — 작성자만
-- ---------------------------------------------------------------
drop policy if exists "upload_post_images_by_owner" on storage.objects;
create policy "upload_post_images_by_owner"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'food-cafe'
  and substring(name from '^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid is not null
  and exists (
    select 1
    from public.posts p
    where p.id = substring(name from '^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid
      and p.writer_uid = auth.uid()
  )
);

drop policy if exists "upload_recipe_images_by_owner" on storage.objects;
create policy "upload_recipe_images_by_owner"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'food-cafe'
  and substring(name from '^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid is not null
  and exists (
    select 1
    from public.recipes r
    where r.id = substring(name from '^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid
      and r.writer_uid = auth.uid()
  )
);

-- ---------------------------------------------------------------
-- UPDATE (메타/덮어쓰기) — 작성자만
--  using: 수정 권한 조건
--  with check: 수정 후에도 동일 조건 유지 강제
-- ---------------------------------------------------------------
drop policy if exists "update_post_images_by_owner" on storage.objects;
create policy "update_post_images_by_owner"
on storage.objects
for update to authenticated
using (
  bucket_id = 'food-cafe'
  and substring(name from '^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid is not null
  and exists (
    select 1
    from public.posts p
    where p.id = substring(name from '^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid
      and p.writer_uid = auth.uid()
  )
)
with check (
  bucket_id = 'food-cafe'
  and substring(name from '^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid is not null
  and exists (
    select 1
    from public.posts p
    where p.id = substring(name from '^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid
      and p.writer_uid = auth.uid()
  )
);

drop policy if exists "update_recipe_images_by_owner" on storage.objects;
create policy "update_recipe_images_by_owner"
on storage.objects
for update to authenticated
using (
  bucket_id = 'food-cafe'
  and substring(name from '^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid is not null
  and exists (
    select 1
    from public.recipes r
    where r.id = substring(name from '^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid
      and r.writer_uid = auth.uid()
  )
)
with check (
  bucket_id = 'food-cafe'
  and substring(name from '^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid is not null
  and exists (
    select 1
    from public.recipes r
    where r.id = substring(name from '^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid
      and r.writer_uid = auth.uid()
  )
);

-- ---------------------------------------------------------------
-- DELETE — 작성자만
-- ---------------------------------------------------------------
drop policy if exists "delete_post_images_by_owner" on storage.objects;
create policy "delete_post_images_by_owner"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'food-cafe'
  and substring(name from '^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid is not null
  and exists (
    select 1
    from public.posts p
    where p.id = substring(name from '^posts/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid
      and p.writer_uid = auth.uid()
  )
);

drop policy if exists "delete_recipe_images_by_owner" on storage.objects;
create policy "delete_recipe_images_by_owner"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'food-cafe'
  and substring(name from '^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid is not null
  and exists (
    select 1
    from public.recipes r
    where r.id = substring(name from '^recipes/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/')::uuid
      and r.writer_uid = auth.uid()
  )
);


commit;
