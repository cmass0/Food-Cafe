import { afterEach, describe, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadPaths(bucket = "food-images") {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co/");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET", bucket);
  vi.resetModules();
  return import("./paths");
}

describe("Storage 경로 생성과 검증", () => {
  test("콘텐츠 경로에서 파일명을 정리하고 소유자를 판별한다", async () => {
    const paths = await loadPaths();
    const path = paths.contentImagePath("recipes", "user-1", "recipe-1", "my / image.jpg");

    expect(path).toBe("recipes/user-1/recipe-1/my---image.jpg");
    expect(paths.isManagedStoragePath(path)).toBe(true);
    expect(paths.isOwnedStoragePath(path, "user-1")).toBe(true);
    expect(paths.isOwnedStoragePath(path, "user-2")).toBe(false);
  });

  test.each([
    "../secret.jpg",
    "/recipes/user-1/recipe-1/image.jpg",
    "https://example.com/image.jpg",
    "recipes/user-1/../image.jpg",
    "unknown/user-1/content-1/image.jpg",
  ])("관리 범위를 벗어난 경로 %s를 거부한다", async (path) => {
    const paths = await loadPaths();
    expect(paths.isManagedStoragePath(path)).toBe(false);
  });

  test("상대 경로를 현재 프로젝트의 공개 URL로 바꾼다", async () => {
    const paths = await loadPaths("food images");

    expect(paths.resolveStorageImageUrl("recipes/user 1/recipe-1/a b.jpg")).toBe(
      "https://project.supabase.co/storage/v1/object/public/food%20images/recipes/user%201/recipe-1/a%20b.jpg"
    );
  });

  test("기존 관리 URL은 DB 저장용 상대 경로로 되돌리고 외부 URL은 보존한다", async () => {
    const paths = await loadPaths();
    const managedUrl =
      "https://project.supabase.co/storage/v1/object/public/food-images/posts/user-1/post-1/a.jpg";
    const externalUrl = "https://cdn.example.com/a.jpg";

    expect(paths.normalizeStoredImageReference(managedUrl)).toBe("posts/user-1/post-1/a.jpg");
    expect(paths.normalizeStoredImageReference(externalUrl)).toBe(externalUrl);
  });

  test("버킷 설정이 없으면 쓰기 작업을 시작하지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET", "");
    vi.resetModules();
    const paths = await import("./paths");

    expect(paths.getStorageBucket()).toBeNull();
    expect(() => paths.requireStorageBucket()).toThrow(
      "NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET 환경변수가 필요합니다."
    );
  });
});
