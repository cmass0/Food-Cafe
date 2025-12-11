"use client";
import * as React from "react";
import { Heart } from "lucide-react";

import { toggleRecipeLike } from "../api";

type Props = {
  recipeId: string;
  liked: boolean;
  count: number;
  onChange(next: { liked: boolean }): void;
};

export default function LikeButton({ recipeId, liked, count, onChange }: Props) {
  const [pending, start] = React.useTransition();
  const disabled = pending;

  function handleClick() {
    start(async () => {
      try {
        const { liked: nextLiked } = await toggleRecipeLike(recipeId, liked);
        onChange({ liked: nextLiked });
      } catch (error) {
        console.error("Failed to toggle like:", error);
      }
    });
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`좋아요 ${count}개`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/60 bg-black/20 text-emerald-100 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
      onClick={handleClick}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          liked ? "fill-emerald-400 text-emerald-400" : "text-emerald-100"
        }`}
      />
      <span className="sr-only">좋아요 {count}개</span>
    </button>
  );
}

