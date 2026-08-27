const DEFAULT_STORAGE_BUCKET = "Food-Cafe";

// 버킷 이름은 한 곳에서만 관리한다. 환경변수를 아직 설정하지 않은 기존 환경은
// 현재 버킷을 그대로 사용하고, 배포 환경별 버킷은 환경변수로 덮어쓸 수 있다.
export const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_STORAGE_BUCKET;

export const CONTENT_IMAGE_TYPES = ["recipes", "combos", "posts"] as const;
export type ContentImageType = (typeof CONTENT_IMAGE_TYPES)[number];
export type UploadImageType = ContentImageType | "avatars";

const MANAGED_ROOTS = new Set<string>([
  ...CONTENT_IMAGE_TYPES,
  "avatars",
  // 기존 게시글이 참조하는 동안에는 정리 대상 판정에 포함하되 바로 제거하지 않는다.
  "posts-temp",
]);

export function sanitizeFilename(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, "-");
  return trimmed.replace(/[\\/]+/g, "-");
}

export function fileExtension(name?: string | null): string {
  if (!name) return "";
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index) : "";
}

export function randomKey(prefix?: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now();
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

export function contentImagePath(
  type: ContentImageType,
  userId: string,
  contentId: string,
  filename: string
): string {
  return `${type}/${userId}/${contentId}/${sanitizeFilename(filename)}`;
}

export function avatarImagePath(userId: string, filename: string): string {
  return `avatars/${userId}/${sanitizeFilename(filename)}`;
}

export function storagePrefix(type: UploadImageType, userId: string, contentId?: string): string {
  if (type === "avatars") return `avatars/${userId}`;
  if (!contentId) throw new Error("콘텐츠 이미지 경로에는 콘텐츠 ID가 필요합니다.");
  return `${type}/${userId}/${contentId}`;
}

export function isManagedStoragePath(path: string): boolean {
  if (!path || path !== path.trim() || path.startsWith("/") || path.includes("\\")) return false;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) return false;

  const segments = path.split("/");
  const [root] = segments;
  const hasExpectedDepth =
    root === "avatars" || root === "posts-temp" ? segments.length >= 3 : segments.length >= 4;
  return (
    MANAGED_ROOTS.has(root ?? "") &&
    hasExpectedDepth &&
    segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..")
  );
}

export function isOwnedStoragePath(path: string, userId: string): boolean {
  if (!isManagedStoragePath(path)) return false;
  const [, pathUserId] = path.split("/");
  return pathUserId === userId;
}

function projectUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  return value || null;
}

function publicObjectPrefix(): string | null {
  const baseUrl = projectUrl();
  return baseUrl
    ? `${baseUrl}/storage/v1/object/public/${encodeURIComponent(STORAGE_BUCKET)}/`
    : null;
}

function decodeStoragePath(value: string): string | null {
  try {
    const path = decodeURIComponent(value);
    return isManagedStoragePath(path) ? path : null;
  } catch {
    return null;
  }
}

/** DB의 새 상대 경로와 이전 공개 URL을 모두 관리 대상 Storage 경로로 정규화한다. */
export function managedStoragePathFromValue(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  const trimmed = value.trim();
  if (isManagedStoragePath(trimmed)) return trimmed;

  const prefix = publicObjectPrefix();
  if (!prefix || !trimmed.startsWith(prefix)) return null;

  const rawPath = trimmed.slice(prefix.length).split(/[?#]/, 1)[0] ?? "";
  return decodeStoragePath(rawPath);
}

/** 이전 코드가 사용하는 이름을 유지한다. 새 코드는 managedStoragePathFromValue를 사용한다. */
export const managedStoragePathFromUrl = managedStoragePathFromValue;

/**
 * DB 이미지 참조를 화면에서 사용할 주소로 바꾼다.
 * 관리 대상 상대 경로만 현재 프로젝트 URL과 버킷으로 조합하고, 기존 외부 URL과 blob/data
 * 미리보기 주소는 그대로 통과시켜 마이그레이션 중에도 화면이 깨지지 않게 한다.
 */
export function resolveStorageImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  const trimmed = value.trim();
  const path = managedStoragePathFromValue(trimmed);
  if (!path) return trimmed;

  const prefix = publicObjectPrefix();
  if (!prefix) return trimmed === path ? null : trimmed;

  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${prefix}${encodedPath}`;
}

/** 관리 대상 공개 URL은 DB 저장용 상대 경로로 되돌리고, 기존 외부 URL은 보존한다. */
export function normalizeStoredImageReference(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  const trimmed = value.trim();
  return managedStoragePathFromValue(trimmed) ?? trimmed;
}
