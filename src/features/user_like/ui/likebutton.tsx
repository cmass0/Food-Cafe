"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { likeOnceAction } from "@/app/recipes/actions";

type Props = {
  recipeId: string;
  initialLiked: boolean;
  initialCount: number;
};

export default function LikeButton({ recipeId, initialLiked, initialCount }: Props) {
  const [liked, setLiked] = React.useState(initialLiked);
  const [count, setCount] = React.useState(initialCount);
  const [pending, start] = React.useTransition();

  const disabled = pending || liked; // 이미 좋아요면 비활성화

  return (
    <Button
      variant={liked ? "default" : "outline"}
      disabled={disabled}
      onClick={() =>
        start(async () => {
          if (liked) return; // 클릭 중복 방지
          try {
            const { count: nextCount } = await likeOnceAction(recipeId);
            setLiked(true);
            setCount(nextCount);
          } catch (e) {
            console.error(e); // TODO: AUTH_REQUIRED 처리
          }
        })
      }
    >
      좋아요 {count}
    </Button>
  );
}

