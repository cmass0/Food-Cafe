"use client";

import CommentThread from "./CommentThread.client";
import { CommentDisplayItem } from "../types";

type RecipeCommentsProps = {
  recipeId: string;
  pageSize?: number;
  defaultWriterName?: string;
  items: CommentDisplayItem[];
};

export default function RecipeComments({
  recipeId,
  pageSize,
  defaultWriterName,
  items,
}: RecipeCommentsProps) {
  return (
    <CommentThread
      parentType="recipe"
      parentId={recipeId}
      pageSize={pageSize}
      defaultWriterName={defaultWriterName}
      items={items}
    />
  );
}
