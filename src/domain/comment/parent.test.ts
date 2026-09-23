import { describe, expect, test } from "vitest";

import { readCommentParent, toCommentParentColumns } from "./parent";

const PARENT_ID = "00000000-0000-4000-8000-000000000002";
const OTHER_ID = "00000000-0000-4000-8000-000000000003";

describe("toCommentParentColumns", () => {
  test.each([
    ["post", { post_id: PARENT_ID, recipe_id: null, combo_id: null }],
    ["recipe", { post_id: null, recipe_id: PARENT_ID, combo_id: null }],
    ["combo", { post_id: null, recipe_id: null, combo_id: PARENT_ID }],
  ] as const)("%s 댓글은 해당 부모 컬럼에만 ID를 넣는다", (parentType, expected) => {
    expect(toCommentParentColumns(parentType, PARENT_ID)).toEqual(expected);
  });
});

describe("readCommentParent", () => {
  test.each(["post", "recipe", "combo"] as const)(
    "%s 컬럼에서 만든 값을 같은 부모 종류와 ID로 되돌린다",
    (parentType) => {
      expect(readCommentParent(toCommentParentColumns(parentType, PARENT_ID))).toEqual({
        parentType,
        parentId: PARENT_ID,
      });
    }
  );

  test("부모 컬럼이 모두 비어 있으면 거부한다", () => {
    expect(() => readCommentParent({ post_id: null, recipe_id: null, combo_id: null })).toThrow(
      "댓글의 부모는 정확히 하나여야 합니다."
    );
  });

  test("부모 컬럼이 둘 이상 채워져 있으면 거부한다", () => {
    expect(() =>
      readCommentParent({ post_id: PARENT_ID, recipe_id: OTHER_ID, combo_id: null })
    ).toThrow("댓글의 부모는 정확히 하나여야 합니다.");
  });

  test("빈 문자열 ID는 부모 값으로 인정하지 않는다", () => {
    expect(() => readCommentParent({ post_id: "", recipe_id: null, combo_id: null })).toThrow(
      "댓글의 부모는 정확히 하나여야 합니다."
    );
  });
});
