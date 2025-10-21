-- 0006_storage_policies.sql
-- Storage policies for posts/recipes images in bucket `food-cafe`

-- Helper: safely extract UUID from object name following a fixed prefix
-- Returns NULL if the name does not match the expected pattern
create or replace function public.uuid_from_object_name(prefix text, objname text)
returns uuid
language sql
immutable
as $$
  select substring(objname from ('^' || prefix || '/([0-9a-fA-F-]{36})/'))::uuid;
$$;

-- INSERT (upload) — only the owner of the post/recipe can upload
create policy if not exists upload_post_images_by_owner
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'food-cafe'
  and uuid_from_object_name('posts', name) is not null
  and exists (
    select 1 from public.posts p
    where p.id = uuid_from_object_name('posts', name)
      and p.writer_uid = auth.uid()
  )
);

create policy if not exists upload_recipe_images_by_owner
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'food-cafe'
  and uuid_from_object_name('recipes', name) is not null
  and exists (
    select 1 from public.recipes r
    where r.id = uuid_from_object_name('recipes', name)
      and r.writer_uid = auth.uid()
  )
);

-- UPDATE (metadata/overwrite) — only the owner
create policy if not exists update_post_images_by_owner
on storage.objects
for update to authenticated
using (
  bucket_id = 'food-cafe'
  and uuid_from_object_name('posts', name) is not null
  and exists (
    select 1 from public.posts p
    where p.id = uuid_from_object_name('posts', name)
      and p.writer_uid = auth.uid()
  )
)
with check (
  bucket_id = 'food-cafe'
  and uuid_from_object_name('posts', name) is not null
  and exists (
    select 1 from public.posts p
    where p.id = uuid_from_object_name('posts', name)
      and p.writer_uid = auth.uid()
  )
);

create policy if not exists update_recipe_images_by_owner
on storage.objects
for update to authenticated
using (
  bucket_id = 'food-cafe'
  and uuid_from_object_name('recipes', name) is not null
  and exists (
    select 1 from public.recipes r
    where r.id = uuid_from_object_name('recipes', name)
      and r.writer_uid = auth.uid()
  )
)
with check (
  bucket_id = 'food-cafe'
  and uuid_from_object_name('recipes', name) is not null
  and exists (
    select 1 from public.recipes r
    where r.id = uuid_from_object_name('recipes', name)
      and r.writer_uid = auth.uid()
  )
);

-- DELETE — only the owner
create policy if not exists delete_post_images_by_owner
on storage.objects
for delete to authenticated
using (
  bucket_id = 'food-cafe'
  and uuid_from_object_name('posts', name) is not null
  and exists (
    select 1 from public.posts p
    where p.id = uuid_from_object_name('posts', name)
      and p.writer_uid = auth.uid()
  )
);

create policy if not exists delete_recipe_images_by_owner
on storage.objects
for delete to authenticated
using (
  bucket_id = 'food-cafe'
  and uuid_from_object_name('recipes', name) is not null
  and exists (
    select 1 from public.recipes r
    where r.id = uuid_from_object_name('recipes', name)
      and r.writer_uid = auth.uid()
  )
);

-- (Optional) READ policies — make objects under posts/ and recipes/ publicly readable.
-- Comment these out if the bucket is private and you will use signed URLs.
create policy if not exists read_posts_images_public
on storage.objects
for select
using (
  bucket_id = 'food-cafe'
  and name like 'posts/%'
);

create policy if not exists read_recipes_images_public
on storage.objects
for select
using (
  bucket_id = 'food-cafe'
  and name like 'recipes/%'
);

