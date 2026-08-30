import { getBrowserSupabase } from "../supabase";
import {
  avatarImagePath,
  contentImagePath,
  fileExtension,
  isManagedStoragePath,
  randomKey,
  requireStorageBucket,
  type UploadImageType,
} from "./paths";

export { fileExtension, randomKey, sanitizeFilename } from "./paths";

// 이미지 업로드 공용 함수
export async function uploadBucketImage(
  type: UploadImageType,
  userId: string,
  contentId: string,
  file: File | Blob,
  opts?: { filename?: string; upsert?: boolean; contentType?: string }
): Promise<{ path: string }> {
  const base = opts?.filename ?? `${randomKey("img")}${fileExtension((file as File)?.name)}`;
  const path =
    type === "avatars"
      ? avatarImagePath(userId, base)
      : contentImagePath(type, userId, contentId, base);
  const bucket = requireStorageBucket();
  const client = getBrowserSupabase();
  const { error } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: Boolean(opts?.upsert),
    contentType: opts?.contentType,
  });
  if (error) throw error;

  // DB에는 공개 URL이 아니라 버킷 내부 상대 경로만 저장한다.
  return { path };
}

// 서버 요청 전 일부 업로드만 성공한 경우의 빠른 롤백이다.
// 네트워크 단절로 실패하면 서버의 주기적 고아 파일 정리가 최종 안전망이 된다.
export async function removeUploadedBucketImages(paths: string[]): Promise<void> {
  const safePaths = [...new Set(paths)].filter(isManagedStoragePath);
  if (safePaths.length === 0) return;

  const bucket = requireStorageBucket();
  const client = getBrowserSupabase();
  const { error } = await client.storage.from(bucket).remove(safePaths);
  if (error) throw error;
}
