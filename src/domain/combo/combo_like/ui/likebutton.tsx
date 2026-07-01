"use client";

import { Heart } from "lucide-react";
import * as React from "react";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { isUnauthorizedApiError } from "@/lib/api/client";
import { toggleComboLike } from "../api";
import { ToggleComboLike } from "../types";

type Props = {
  comboId: string;
  liked: boolean;
  count: number;
  onChange?(next: ToggleComboLike): void;
};

function currentNextUrl() {
  const next = new URL(window.location.href);
  return `${next.pathname}${next.search}`;
}

export default function ComboCardLikeButton({ comboId, liked, count, onChange }: Props) {
  const [localLiked, setLocalLiked] = React.useState(liked);
  const [localCount, setLocalCount] = React.useState(count);
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  React.useEffect(() => {
    setLocalLiked(liked);
    setLocalCount(count);
  }, [liked, count]);

  async function handleClick() {
    if (!user) {
      openAuthModal({ next: currentNextUrl() });
      return;
    }

    try {
      const { liked: nextLiked, likeCount } = await toggleComboLike(comboId);
      if (onChange) {
        onChange({ liked: nextLiked, likeCount });
      } else {
        setLocalLiked(nextLiked);
        if (typeof likeCount === "number") {
          setLocalCount(likeCount);
        }
      }
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        openAuthModal({ next: currentNextUrl() });
        return;
      }
      console.error("조합 좋아요 토글 실패:", error);
    }
  }

  const displayLiked = onChange ? liked : localLiked;
  const displayCount = onChange ? count : localCount;

  return (
    <button
      type="button"
      aria-label={`좋아요 ${displayCount}`}
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-emerald-300/60 text-emerald-100 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
      onClick={handleClick}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          displayLiked ? "fill-red-400 text-red-400" : "text-red-400"
        }`}
      />
      <span className="sr-only">좋아요 {displayCount}</span>
    </button>
  );
}
