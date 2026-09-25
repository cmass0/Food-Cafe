-- 브라우저에서 자기 파일을 지울 수 있도록 자기 폴더 조회 정책을 추가한다.
--
-- storage-js의 remove()는 storage.objects에 DELETE와 SELECT 권한이 모두 필요하다.
-- PostgreSQL은 조건을 붙인 DELETE에 SELECT 정책도 적용하므로, 조회 정책이 없으면 삭제가 0행으로 끝난다.
-- 업로드 실패 롤백(removeUploadedBucketImages)이 이 삭제를 쓴다.
-- 공개 이미지는 공개 URL로 읽으므로, 조회는 로그인 사용자의 자기 폴더로만 한정한다.

create policy food_cafe_images_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'Food-Cafe'
    and (storage.foldername(name))[1] = any (array['recipes', 'combos', 'posts', 'avatars'])
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );
