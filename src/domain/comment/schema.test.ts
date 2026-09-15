import { describe, expect, test } from "vitest";

import { commentInsertSchema, commentListOptionsSchema, commentUpdateSchema } from "./schema";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const PARENT_ID = "00000000-0000-4000-8000-000000000002";

describe("댓글 입력", () => {
  test("본문 바깥 공백을 제거한다", () => {
    const result = commentInsertSchema.parse({
      content: "  맛있어 보여요  ",
      parentType: "recipe",
      parentId: PARENT_ID,
      writerName: "작성자",
      writerUid: USER_ID,
    });

    expect(result.content).toBe("맛있어 보여요");
  });

  test.each([
    ["빈 댓글", "   "],
    ["1001자 댓글", "가".repeat(1001)],
  ] as const)("%s은 content 오류로 거부한다", (_label, content) => {
    const result = commentInsertSchema.safeParse({
      content,
      parentType: "recipe",
      parentId: PARENT_ID,
      writerName: "작성자",
      writerUid: USER_ID,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.path[0] === "content")).toBe(true);
  });

  test("1000자 댓글을 허용한다", () => {
    expect(
      commentInsertSchema.safeParse({
        content: "가".repeat(1000),
        parentType: "post",
        parentId: PARENT_ID,
        writerName: "작성자",
        writerUid: USER_ID,
      }).success
    ).toBe(true);
  });
});

describe("댓글 수정과 목록 조회", () => {
  test("수정 내용이 비어 있으면 거부한다", () => {
    const result = commentUpdateSchema.safeParse({});

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe("최소 한 개 이상의 필드를 채워야 합니다.");
  });

  test.each([
    ["잘못된 부모 종류", { parentType: "user", parentId: PARENT_ID }],
    ["UUID가 아닌 부모 ID", { parentType: "combo", parentId: "combo-1" }],
    ["0 페이지", { parentType: "recipe", parentId: PARENT_ID, page: 0 }],
    ["101개 조회", { parentType: "recipe", parentId: PARENT_ID, limit: 101 }],
  ] as const)("%s은 목록 요청에서 거부한다", (_label, input) => {
    expect(commentListOptionsSchema.safeParse(input).success).toBe(false);
  });
});
