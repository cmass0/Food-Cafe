import { describe, expect, test } from "vitest";

import {
  POST_CONTENT_MAX_CHARS,
  POST_CONTENT_TOO_LARGE_MESSAGE,
  postInsertSchema,
  postListOptionsSchema,
  postUpdateSchema,
} from "./schema";

const CONTENT = { root: { children: [] } };
const HTML = "<p>본문</p>";

describe("postInsertSchema", () => {
  test("제목의 바깥 공백을 제거하고 정상 게시글을 허용한다", () => {
    const result = postInsertSchema.parse({
      title: "  첫 게시글  ",
      content_json: CONTENT,
      content_html: HTML,
      category: "free",
    });

    expect(result.title).toBe("첫 게시글");
  });

  test.each([
    [
      "빈 제목",
      { title: "   ", content_json: CONTENT, content_html: HTML, category: "free" },
      "title",
    ],
    [
      "151자 제목",
      { title: "가".repeat(151), content_json: CONTENT, content_html: HTML, category: "free" },
      "title",
    ],
    [
      "본문 HTML 없음",
      { title: "게시글", content_json: CONTENT, category: "free" },
      "content_html",
    ],
    [
      "없는 카테고리",
      { title: "게시글", content_json: CONTENT, content_html: HTML, category: "notice" },
      "category",
    ],
    [
      "문자열 본문",
      { title: "게시글", content_json: "plain text", content_html: HTML, category: "free" },
      "content_json",
    ],
  ] as const)("%s은 %s 오류로 거부한다", (_label, input, field) => {
    const result = postInsertSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
  });

  test("150자 제목을 허용한다", () => {
    expect(
      postInsertSchema.safeParse({
        title: "가".repeat(150),
        content_json: CONTENT,
        content_html: HTML,
        category: "free",
      }).success
    ).toBe(true);
  });

  test("본문 HTML은 상한 글자 수까지 허용한다", () => {
    expect(
      postInsertSchema.safeParse({
        title: "게시글",
        content_json: CONTENT,
        content_html: "가".repeat(POST_CONTENT_MAX_CHARS),
        category: "free",
      }).success
    ).toBe(true);
  });

  test("본문 HTML이 상한을 넘으면 크기 안내 문구로 거부한다", () => {
    const result = postInsertSchema.safeParse({
      title: "게시글",
      content_json: CONTENT,
      content_html: "가".repeat(POST_CONTENT_MAX_CHARS + 1),
      category: "free",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]).toMatchObject({
      path: ["content_html"],
      message: POST_CONTENT_TOO_LARGE_MESSAGE,
    });
  });
});

describe("postUpdateSchema", () => {
  test("수정할 필드가 하나도 없으면 거부한다", () => {
    const result = postUpdateSchema.safeParse({});

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe("수정할 항목을 한 가지 이상 입력해 주세요.");
  });

  test("일부 필드만 수정할 수 있다", () => {
    expect(postUpdateSchema.parse({ category: "review" })).toEqual({ category: "review" });
  });

  test("본문 JSON과 HTML을 함께 수정할 수 있다", () => {
    expect(postUpdateSchema.parse({ content_json: CONTENT, content_html: HTML })).toEqual({
      content_json: CONTENT,
      content_html: HTML,
    });
  });

  test.each([
    ["JSON만", { content_json: CONTENT }],
    ["HTML만", { content_html: HTML }],
  ] as const)("본문을 %s 바꾸면 거부한다", (_label, input) => {
    const result = postUpdateSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe("유효하지 않은 게시글 형식입니다.");
  });
});

describe("postListOptionsSchema", () => {
  test.each([
    ["0개 조회", { limit: 0 }, "limit"],
    ["51개 조회", { limit: 51 }, "limit"],
    ["0 페이지", { page: 0 }, "page"],
    ["소수 페이지", { page: 1.5 }, "page"],
    ["없는 정렬", { sort: "popular" }, "sort"],
  ] as const)("%s은 %s 오류로 거부한다", (_label, input, field) => {
    const result = postListOptionsSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
  });

  test("조회 상한 50개와 양의 페이지를 허용한다", () => {
    expect(postListOptionsSchema.parse({ limit: 50, page: 2, sort: "recent" })).toEqual({
      limit: 50,
      page: 2,
      sort: "recent",
    });
  });
});
