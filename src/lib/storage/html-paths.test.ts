import { afterEach, describe, expect, test, vi } from "vitest";

const BUCKET = "food-images";
const PUBLIC_PREFIX = `https://project.supabase.co/storage/v1/object/public/${BUCKET}/`;
const POST_IMAGE = "posts/00000000-0000-4000-8000-000000000001/post-1/a.webp";
const OTHER_IMAGE = "posts/00000000-0000-4000-8000-000000000001/post-1/b.webp";

async function loadHtmlPaths() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co/");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET", BUCKET);
  vi.resetModules();
  return import("./html-paths");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("managedPathsFromHtml", () => {
  test("저장된 본문 HTML의 이미지 상대 경로를 모은다", async () => {
    const { managedPathsFromHtml } = await loadHtmlPaths();

    const html = `<p>앞</p><img src="${POST_IMAGE}" alt="" /><p><img src="${OTHER_IMAGE}"></p>`;

    expect([...managedPathsFromHtml(html)]).toEqual([POST_IMAGE, OTHER_IMAGE]);
  });

  test("Storage 공개 주소로 적힌 이미지도 상대 경로로 바꿔 모은다", async () => {
    const { managedPathsFromHtml } = await loadHtmlPaths();

    const html = `<img src="${PUBLIC_PREFIX}${POST_IMAGE}?v=1">`;

    expect([...managedPathsFromHtml(html)]).toEqual([POST_IMAGE]);
  });

  test("따옴표 없이·작은따옴표로 적은 src도 읽는다", async () => {
    const { managedPathsFromHtml } = await loadHtmlPaths();

    const html = `<img src=${POST_IMAGE}><img src='${OTHER_IMAGE}'>`;

    expect([...managedPathsFromHtml(html)]).toEqual([POST_IMAGE, OTHER_IMAGE]);
  });

  test("같은 이미지가 여러 번 나와도 한 번만 센다", async () => {
    const { managedPathsFromHtml } = await loadHtmlPaths();

    const html = `<img src="${POST_IMAGE}"><img src="${POST_IMAGE}">`;

    expect([...managedPathsFromHtml(html)]).toEqual([POST_IMAGE]);
  });

  test("우리 Storage가 아닌 이미지와 img가 아닌 태그의 주소는 모으지 않는다", async () => {
    const { managedPathsFromHtml } = await loadHtmlPaths();

    const html = [
      `<img src="https://example.com/a.webp">`,
      `<a href="${POST_IMAGE}">링크</a>`,
      `<iframe src="https://www.youtube.com/embed/x"></iframe>`,
      `<img alt="주소 없음">`,
    ].join("");

    expect(managedPathsFromHtml(html).size).toBe(0);
  });

  test.each([
    ["null", null],
    ["undefined", undefined],
    ["빈 문자열", ""],
    ["문자열이 아닌 값", { html: `<img src="${POST_IMAGE}">` }],
  ] as const)("%s는 빈 목록이다", async (_label, value) => {
    const { managedPathsFromHtml } = await loadHtmlPaths();

    expect(managedPathsFromHtml(value).size).toBe(0);
  });
});
