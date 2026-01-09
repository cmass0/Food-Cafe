"use client";

import { Heart } from "lucide-react";
import * as React from "react";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { toggleComboLike } from "../api";
import { ToggleComboLike } from "../types";

type Props = {
  comboId: string;
  liked: boolean;
  count: number;
  onChange?(next: ToggleComboLike): void;
};

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
      const next = new URL(window.location.href);
      const nextUrl = `${next.pathname}${next.search}`;
      openAuthModal({ next: nextUrl });
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
      console.error("Failed to toggle like:", error);
    }
  }

  const displayLiked = onChange ? liked : localLiked;
  const displayCount = onChange ? count : localCount;

  return (
    <button
      type="button"
      aria-label={`Like ${displayCount}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/60 bg-black/20 text-emerald-100 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
      onClick={handleClick}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          displayLiked ? "fill-emerald-400 text-emerald-400" : "text-emerald-100"
        }`}
      />
      <span className="sr-only">Like {displayCount}</span>
    </button>
  );
}

function LikeButtonInner() {}
