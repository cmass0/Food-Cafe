"use client";

import CommentThread from "./CommentThread.client";

type RecipeCommentsProps = {
  recipeId: string;
  pageSize?: number;
  defaultWriterName?: string;
};

export default function RecipeComments({
  recipeId,
  pageSize,
  defaultWriterName,
}: RecipeCommentsProps) {
  return (
    <CommentThread
      parentType="recipe"
      parentId={recipeId}
      pageSize={pageSize}
      defaultWriterName={defaultWriterName}
    />
  );
}
