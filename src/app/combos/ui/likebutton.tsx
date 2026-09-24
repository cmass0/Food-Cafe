"use client";

import { Heart } from "lucide-react";
import * as React from "react";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { isUnauthorizedApiError } from "@/lib/api/client";
import { setComboLike } from "@/domain/combo/combo_like/api";
import { ComboLikeResult } from "@/domain/combo/combo_like/types";

type Props = {
  comboId: string;
  liked: boolean;
  count: number;
  onChange?(next: ComboLikeResult): void;
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
      const currentLiked = onChange ? liked : localLiked;
      const { liked: nextLiked, likeCount } = await setComboLike(comboId, !currentLiked);
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
      console.error("조합 좋아요 처리 실패:", error);
    }
  }

  const displayLiked = onChange ? liked : localLiked;
  const displayCount = onChange ? count : localCount;

  return (
    <button
      type="button"
      aria-label={`좋아요 ${displayCount}`}
      className="group inline-grid h-11 w-11 cursor-pointer place-items-center rounded-full text-emerald-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900 disabled:cursor-not-allowed disabled:opacity-70"
      onClick={handleClick}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full border border-emerald-300/60 shadow-sm transition group-hover:border-emerald-200 group-hover:bg-emerald-500/20 group-hover:text-emerald-50">
        <Heart
          className={`h-4 w-4 transition-colors ${
            displayLiked ? "fill-red-400 text-red-400" : "text-red-400"
          }`}
          aria-hidden="true"
        />
      </span>
      <span className="sr-only">좋아요 {displayCount}</span>
    </button>
  );
}
