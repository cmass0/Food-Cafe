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
  5242880,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 로컬 전용 앱 서버 확인값. 게시글·레시피·조합 쓰기 정책(private.is_app_server)이 x-app-server-key 헤더와 비교한다.
-- .env.e2e.local 등 로컬 Supabase를 쓰는 환경의 SUPABASE_APP_SERVER_KEY에 같은 값을 둔다. 원격에는 다른 무작위 값을 쓴다.
delete from vault.secrets where name = 'app_server_key';
select vault.create_secret('local-dev-app-server-key', 'app_server_key', '앱 서버 요청 확인값(로컬 전용)');
