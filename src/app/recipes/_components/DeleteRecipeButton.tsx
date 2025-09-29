"use client";

import { useTransition } from "react";
import { deleteRecipeAction } from "../actions";

type DeleteRecipeButtonProps = {
  recipeId: string;
};

export default function DeleteRecipeButton({ recipeId }: DeleteRecipeButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm("정말로 이 레시피를 삭제하시겠어요?");
    if (!confirmed) return;

    startTransition(async () => {
      await deleteRecipeAction(recipeId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded border border-red-500 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
    >
      {isPending ? "삭제 중..." : "레시피 삭제"}
    </button>
  );
}
