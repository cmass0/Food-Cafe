-- 로컬 Supabase Storage의 공개 이미지 버킷을 원격 프로젝트와 동일하게 구성합니다.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'Food-Cafe',
  'Food-Cafe',
  true,
  null,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
