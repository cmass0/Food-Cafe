import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

let htmlModule: typeof import("./content");

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET", "food-images");
  vi.resetModules();
  htmlModule = await import("./content");
}, 15_000);

afterAll(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("게시글 HTML 정제", () => {
  test("스크립트와 이벤트 속성을 제거하고 새 창 링크를 보호한다", () => {
    const html = htmlModule.sanitizePostHtml(
      '<p onclick="steal()">본문<script>alert(1)</script><a href="https://example.com" target="_blank">링크</a></p>'
    );

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).toContain('rel="noopener"');
  });

  test.each([
    ["javascript 링크", '<a href="javascript:alert(1)">링크</a>', "javascript:"],
    ["HTTP 이미지", '<img src="http://evil.example/a.png">', "http://evil.example"],
    ["HTTP iframe", '<iframe src="http://evil.example/embed"></iframe>', "http://evil.example"],
    ["허용하지 않은 속성", '<p style="position:fixed">본문</p>', "position:fixed"],
  ] as const)("%s을 결과에서 제거한다", (_label, input, forbidden) => {
    expect(htmlModule.sanitizePostHtml(input)).not.toContain(forbidden);
  });

  test("허용된 본문과 HTTPS 이미지를 보존한다", () => {
    const html = htmlModule.sanitizePostHtml(
      '<p><strong>중요</strong>한 본문입니다.</p><img src="https://example.com/a.png" alt="요리">'
    );

    expect(html).toBe(
      '<p><strong>중요</strong>한 본문입니다.</p><img src="https://example.com/a.png" alt="요리" />'
    );
  });

  test("단독 YouTube 주소를 안전한 미리보기 카드로 바꾼다", () => {
    const html = htmlModule.enhanceStandaloneYouTubeLinks(
      '<p><a href="https://youtu.be/dQw4w9WgXcQ">https://youtu.be/dQw4w9WgXcQ</a></p>'
    );

    expect(html).toContain('data-youtube-video-id="dQw4w9WgXcQ"');
    expect(html).toContain("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(html).toContain('rel="noopener noreferrer"');
  });

  test("본문의 상대 이미지 경로를 공개 URL로 바꾼다", () => {
    const html = htmlModule.renderPostContentHtml(
      '<p><img src="posts/user-1/post-1/a b.jpg" alt="본문 이미지"></p>'
    );

    expect(html).toContain(
      'src="https://project.supabase.co/storage/v1/object/public/food-images/posts/user-1/post-1/a%20b.jpg"'
    );
  });

  test("직렬화된 에디터 형식이 아니면 변환을 거부한다", () => {
    expect(() => htmlModule.buildPostContentHtml({ children: [] })).toThrow(
      "유효하지 않은 형식입니다."
    );
    expect(() => htmlModule.buildPostContentText(null)).toThrow("유효하지 않은 형식입니다.");
  });
});
