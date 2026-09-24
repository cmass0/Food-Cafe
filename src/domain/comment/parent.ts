import { COMMENT_PARENT_TYPES, type CommentParentType, type CommentRow } from "./types";

// DB는 부모별 FK 컬럼 중 정확히 하나만 값을 가진다(comments_exactly_one_parent_check).
// 화면과 API는 계속 parentType/parentId 한 쌍으로 다루고, 컬럼 변환은 이 파일에서만 한다.
export const COMMENT_PARENT_COLUMNS = {
  post: "post_id",
  recipe: "recipe_id",
  combo: "combo_id",
} as const satisfies Record<CommentParentType, keyof CommentRow>;

export type CommentParentColumns = Pick<CommentRow, "post_id" | "recipe_id" | "combo_id">;

export function toCommentParentColumns(
  parentType: CommentParentType,
  parentId: string
): CommentParentColumns {
  return {
    post_id: parentType === "post" ? parentId : null,
    recipe_id: parentType === "recipe" ? parentId : null,
    combo_id: parentType === "combo" ? parentId : null,
  };
}

export function readCommentParent(row: CommentParentColumns): {
  parentType: CommentParentType;
  parentId: string;
} {
  const parents = COMMENT_PARENT_TYPES.flatMap((parentType) => {
    const parentId = row[COMMENT_PARENT_COLUMNS[parentType]];
    return parentId ? [{ parentType, parentId }] : [];
  });

  // DB 제약이 보장하는 불변식이므로, 어긋나면 잘못된 부모로 응답하지 않고 즉시 실패한다.
  const [parent] = parents;
  if (!parent || parents.length > 1) {
    throw new Error("댓글의 부모는 정확히 하나여야 합니다.");
  }
  return parent;
}
