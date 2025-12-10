"use client";
import * as React from "react";
import { Heart } from "lucide-react";

import { likeOnceAction } from "@/app/recipes/actions";
import { useAuth } from "@/app/auth/auth-context";

type Props = {
  recipeId: string;
  initialLiked: boolean;
  initialCount: number;
};

export default function LikeButton({ recipeId, initialLiked, initialCount }: Props) {
  const [liked, setLiked] = React.useState(initialLiked);
  const [count, setCount] = React.useState(initialCount);
  const [pending, start] = React.useTransition();

  const disabled = pending || liked;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={liked ? `좋아요 ${count}개` : `좋아요 ${count}개`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/60 bg-black/20 text-emerald-100 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
      onClick={() =>
        start(async () => {
          if (liked) return;
          try {
            const { count: nextCount } = await likeOnceAction(recipeId);
            setLiked(true);
            setCount(nextCount);
          } catch (e) {
            console.error(e);
          }
        })
      }
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
