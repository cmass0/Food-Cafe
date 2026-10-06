import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CONTENT_IMAGE_TYPES,
  isManagedStoragePath,
  isOwnedStoragePath,
  managedStoragePathFromValue,
  requireStorageBucket,
  storagePrefix,
  type ContentImageType,
} from "./paths";
import { managedPathsFromHtml } from "./html-paths";

const LIST_PAGE_SIZE = 100;
const REMOVE_BATCH_SIZE = 1_000;
export const STORAGE_CLEANUP_GRACE_MS = 30 * 60 * 1_000;

type StorageFile = {
  path: string;
  createdAt: string | null;
};

function joinStoragePath(prefix: string, name: string): string {
  return prefix ? `${prefix}/${name}` : name;
}

export async function listStorageFilesRecursive(
  client: SupabaseClient<Database>,
  prefix: string
): Promise<StorageFile[]> {
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, "");
  const bucket = requireStorageBucket();
  const files: StorageFile[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client.storage.from(bucket).list(normalizedPrefix, {
      limit: LIST_PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;

    const entries = data ?? [];
    for (const entry of entries) {
      const path = joinStoragePath(normalizedPrefix, entry.name);
      if (entry.id === null) {
        files.push(...(await listStorageFilesRecursive(client, path)));
      } else {
        files.push({ path, createdAt: entry.created_at ?? null });
      }
    }

    if (entries.length < LIST_PAGE_SIZE) break;
    offset += entries.length;
  }

  return files;
}

export async function removeStoragePaths(
  client: SupabaseClient<Database>,
  paths: Iterable<string>
): Promise<number> {
  const safePaths = [...new Set(paths)].filter(isManagedStoragePath);
  if (safePaths.length === 0) return 0;

  const bucket = requireStorageBucket();
  let removed = 0;

  for (let index = 0; index < safePaths.length; index += REMOVE_BATCH_SIZE) {
    const batch = safePaths.slice(index, index + REMOVE_BATCH_SIZE);
    const { error } = await client.storage.from(bucket).remove(batch);
    if (error) throw error;
    removed += batch.length;
  }

  return removed;
}

export async function removeStoragePrefix(
  client: SupabaseClient<Database>,
  prefix: string
): Promise<number> {
  const files = await listStorageFilesRecursive(client, prefix);
  return removeStoragePaths(
    client,
    files.map((file) => file.path)
  );
}

function isOlderThanGrace(createdAt: string | null, now: number, graceMs: number): boolean {
  if (!createdAt) return false;
  const createdTime = Date.parse(createdAt);
  return Number.isFinite(createdTime) && now - createdTime >= graceMs;
}

export async function pruneStoragePrefix(
  client: SupabaseClient<Database>,
  prefix: string,
  keepPaths: Iterable<string>,
  graceMs = STORAGE_CLEANUP_GRACE_MS
): Promise<number> {
  const keep = new Set(keepPaths);
  const now = Date.now();
  const files = await listStorageFilesRecursive(client, prefix);
  const removable = files
    .filter((file) => !keep.has(file.path) && isOlderThanGrace(file.createdAt, now, graceMs))
    .map((file) => file.path);
  return removeStoragePaths(client, removable);
}

function contentPrefix(type: ContentImageType, userId: string, contentId: string): string {
  return storagePrefix(type, userId, contentId);
}

export function managedPathsFromValues(values: Iterable<unknown>): Set<string> {
  const paths = new Set<string>();
  for (const value of values) {
    const path = managedStoragePathFromValue(value);
    if (path) paths.add(path);
  }
  return paths;
}

export function collectManagedPaths(value: unknown, paths = new Set<string>()): Set<string> {
  const directPath = managedStoragePathFromValue(value);
  if (directPath) {
    paths.add(directPath);
    return paths;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectManagedPaths(item, paths);
    return paths;
  }
  if (!value || typeof value !== "object") return paths;
  for (const item of Object.values(value)) collectManagedPaths(item, paths);
  return paths;
}

export async function discardFailedUploads(
  userId: string,
  expectedPrefix: string,
  uploadedPaths: Iterable<string>
): Promise<number> {
  const safePaths = [...new Set(uploadedPaths)].filter(
    (path) => isOwnedStoragePath(path, userId) && path.startsWith(`${expectedPrefix}/`)
  );
  if (safePaths.length === 0) return 0;
  return removeStoragePaths(getAdminSupabase(), safePaths);
}

export async function safeDiscardFailedUploads(
  userId: string,
  expectedPrefix: string,
  uploadedPaths: Iterable<string>
): Promise<void> {
  try {
    await discardFailedUploads(userId, expectedPrefix, uploadedPaths);
  } catch (error) {
    console.error("[storage] 실패한 업로드 롤백 중 오류가 발생했습니다.", error);
  }
}

export async function safePruneContentImages(
  type: ContentImageType,
  userId: string,
  contentId: string,
  referencedValues: Iterable<unknown>
): Promise<void> {
  try {
    const referencedPaths = new Set<string>();
    for (const value of referencedValues) collectManagedPaths(value, referencedPaths);
    await pruneStoragePrefix(
      getAdminSupabase(),
      contentPrefix(type, userId, contentId),
      referencedPaths
    );
  } catch (error) {
    // DB 저장은 이미 성공했으므로 정리 실패를 사용자 요청 실패로 바꾸지 않는다.
    console.error(`[storage] ${type}/${contentId} 미참조 이미지 정리에 실패했습니다.`, error);
  }
}

export async function safeRemoveContentImages(
  type: ContentImageType,
  userId: string,
  contentId: string
): Promise<void> {
  try {
    await removeStoragePrefix(getAdminSupabase(), contentPrefix(type, userId, contentId));
  } catch (error) {
    // 삭제된 DB 행은 되살릴 수 없으므로 파일은 주기적 정리 작업에 맡긴다.
    console.error(`[storage] ${type}/${contentId} 폴더 삭제에 실패했습니다.`, error);
  }
}

export async function safePruneAvatarImages(
  userId: string,
  photoUrl: string | null
): Promise<void> {
  try {
    await pruneStoragePrefix(
      getAdminSupabase(),
      storagePrefix("avatars", userId),
      managedPathsFromValues([photoUrl])
    );
  } catch (error) {
    console.error(`[storage] ${userId} 아바타 정리에 실패했습니다.`, error);
  }
}

export async function safeRemoveAvatarImages(userId: string): Promise<void> {
  try {
    await removeStoragePrefix(getAdminSupabase(), storagePrefix("avatars", userId));
  } catch (error) {
    console.error(`[storage] ${userId} 아바타 폴더 삭제에 실패했습니다.`, error);
  }
}

// ⚠ 여기 적힌 컬럼만 "사용 중"으로 인정된다.
//   이미지 URL이 들어가는 컬럼을 새로 만들면 반드시 이 함수에도 추가할 것.
//   누락하면 그 이미지들이 고아로 판정되어 cleanupOrphanedStorage가 삭제한다.
//   posts.content_html은 브라우저가 만들어 보내므로 JSON에 없는 이미지가 있을 수 있어 함께 읽는다.
async function collectDatabaseReferences(client: SupabaseClient<Database>): Promise<Set<string>> {
  const references = new Set<string>();
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from("recipes")
      .select("image, images")
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    for (const row of data ?? []) collectManagedPaths([row.image, row.images], references);
    if ((data?.length ?? 0) < pageSize) break;
  }

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from("combos")
      .select("image, items")
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    for (const row of data ?? []) collectManagedPaths([row.image, row.items], references);
    if ((data?.length ?? 0) < pageSize) break;
  }

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from("posts")
      .select("content_json, content_html")
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      collectManagedPaths(row.content_json, references);
      for (const path of managedPathsFromHtml(row.content_html)) references.add(path);
    }
    if ((data?.length ?? 0) < pageSize) break;
  }

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from("profiles")
      .select("photo_url")
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    for (const row of data ?? []) collectManagedPaths(row.photo_url, references);
    if ((data?.length ?? 0) < pageSize) break;
  }

  return references;
}

export type StorageCleanupResult = {
  /** true면 실제로 지우지 않고 대상만 계산한 결과다. */
  dryRun: boolean;
  /** 훑어본 저장소 파일 수 */
  scanned: number;
  /** DB가 사용 중인 것으로 확인된 파일 수 */
  referenced: number;
  /** 삭제 조건을 만족한 파일 수 */
  candidates: number;
  /** 실제로 지운 파일 수 (dry-run이면 0) */
  removed: number;
  /** dry-run일 때만 채워지며, 목록이 길면 앞부분만 담는다. */
  wouldRemove?: string[];
};

const DRY_RUN_SAMPLE_LIMIT = 200;

export async function cleanupOrphanedStorage(): Promise<StorageCleanupResult> {
  const admin = getAdminSupabase();
  const references = await collectDatabaseReferences(admin);
  const roots = [...CONTENT_IMAGE_TYPES, "avatars", "posts-temp"];
  const files = (
    await Promise.all(roots.map((root) => listStorageFilesRecursive(admin, root)))
  ).flat();
  const now = Date.now();
  const removable = files
    .filter(
      (file) =>
        !references.has(file.path) &&
        isOlderThanGrace(file.createdAt, now, STORAGE_CLEANUP_GRACE_MS)
    )
    .map((file) => file.path);

  // 삭제는 되돌릴 수 없으므로 실행 전에 대상 목록만 확인할 수 있는 경로를 둔다.
  if (process.env.STORAGE_CLEANUP_DRY_RUN === "1") {
    return {
      dryRun: true,
      scanned: files.length,
      referenced: references.size,
      candidates: removable.length,
      removed: 0,
      wouldRemove: removable.slice(0, DRY_RUN_SAMPLE_LIMIT),
    };
  }

  const removed = await removeStoragePaths(admin, removable);

  return {
    dryRun: false,
    scanned: files.length,
    referenced: references.size,
    candidates: removable.length,
    removed,
  };
}
