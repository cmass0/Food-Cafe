import { describe, expect, test } from "vitest";

import {
  getPostCategoryLabel,
  isPostCategory,
  normalizePostCategory,
  POST_CATEGORY_VALUES,
} from "./category";

describe("게시글 카테고리", () => {
  test.each(POST_CATEGORY_VALUES)("현재 카테고리 %s를 유효한 값으로 판별한다", (category) => {
    expect(isPostCategory(category)).toBe(true);
  });

  test("알 수 없는 값은 카테고리로 인정하지 않는다", () => {
    expect(isPostCategory("notice")).toBe(false);
    expect(isPostCategory(null)).toBe(false);
  });

  test.each([
    ["자유게시판", "free"],
    ["INFO", "recipe_tip"],
    ["qna", "question"],
    ["후기게시판", "review"],
  ] as const)("기존 카테고리 %s를 %s로 정규화한다", (value, expected) => {
    expect(normalizePostCategory(value)).toBe(expected);
  });

  test("표시 라벨을 반환한다", () => {
    expect(getPostCategoryLabel("question")).toBe("질문&답변");
  });
});
