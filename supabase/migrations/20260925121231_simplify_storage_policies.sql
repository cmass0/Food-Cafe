-- Food-Cafe 버킷의 Storage 정책을 실제 쓰는 두 개(업로드·삭제)로 줄이고 파일 크기를 서버에서도 제한한다.
--
-- 앱의 파일 경로: <종류>/<사용자 id>/<콘텐츠 id>/<파일명>  (프로필 사진은 avatars/<사용자 id>/<사용자 id>/<파일명>)
--   - 업로드와 업로드 실패 롤백은 브라우저에서 사용자 권한으로 한다 → 아래 두 정책이 적용된다.
--   - 미참조 파일 정리는 서버가 service_role로 한다 → 정책과 무관하다.
--   - 이미지는 공개 버킷의 공개 URL로 읽는다 → SELECT 정책이 필요 없다.

-- 1. 삭제할 정책 -----------------------------------------------------------------

-- 두 번째 폴더가 콘텐츠 id라고 가정한 옛 경로 형식용이다. 지금은 두 번째 폴더가 사용자 id라 한 번도 적용되지 않는다.
drop policy delete_post_images_by_owner on storage.objects;
drop policy update_post_images_by_owner on storage.objects;
drop policy delete_recipe_images_by_owner on storage.objects;
drop policy update_recipe_images_by_owner on storage.objects;

-- 앱은 덮어쓰기(upsert)를 쓰지 않는다.
drop policy update_food_cafe_images_by_user on storage.objects;

-- 공개 버킷은 공개 URL로 읽으므로 필요 없다. 남겨 두면 posts 폴더의 파일 목록을 누구나 조회할 수 있다.
drop policy public_read_posts_images on storage.objects;

-- posts-temp는 더 이상 업로드하지 않는 옛 임시 폴더다.
drop policy select_posts_temp_by_owner on storage.objects;

-- 앱에 없는 폴더에도 올릴 수 있던 넓은 정책을 아래의 좁은 정책으로 바꾼다.
drop policy upload_food_cafe_images_by_user on storage.objects;
drop policy delete_food_cafe_images_by_user on storage.objects;

-- 2. 남길 정책: 앱이 쓰는 폴더 + 내 사용자 id 폴더만 ------------------------------

create policy food_cafe_images_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'Food-Cafe'
    and (storage.foldername(name))[1] = any (array['recipes', 'combos', 'posts', 'avatars'])
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

create policy food_cafe_images_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'Food-Cafe'
    and (storage.foldername(name))[1] = any (array['recipes', 'combos', 'posts', 'avatars'])
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

-- 3. 파일 크기 ------------------------------------------------------------------
-- 입력 화면의 5MB 제한(src/lib/domain/schema.ts)을 API로 직접 올릴 때도 적용한다.
update storage.buckets
set file_size_limit = 5 * 1024 * 1024
where id = 'Food-Cafe';
