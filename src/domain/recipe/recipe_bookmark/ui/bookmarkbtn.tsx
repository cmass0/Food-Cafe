"use client";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { Bookmark } from "lucide-react";
import * as React from "react";
import { toggleRecipeBookmark } from "../api";
import { ToggleRecipeBookmark } from "../type";

type Props = {
  recipeId: string;
  marked: boolean;
  count: number;
  onChange?(next: ToggleRecipeBookmark): void;
};

export default function RecipeCardBookmarkButton({ recipeId, marked, count, onChange }: Props) {
  const [localMarked, setLocalMarked] = React.useState(marked);
  const [localCount, setLocalCount] = React.useState(count);
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  React.useEffect(() => {
    setLocalMarked(marked);
    setLocalCount(count);
  }, [marked, count]);

  async function handleClick() {
    const currentMarked = onChange ? marked : localMarked;
    if (!user) {
      const next = new URL(window.location.href);
      const nextUrl = `${next.pathname}${next.search}`;
      openAuthModal({ next: nextUrl });
      return;
    }

    try {
      const { bookmarked: nextMarked, bookmarkCount: nextBookmarkCount } =
        await toggleRecipeBookmark(recipeId, currentMarked);

      if (onChange) {
        onChange({ bookmarked: nextMarked, bookmarkCount: nextBookmarkCount });
      } else {
        setLocalMarked(nextMarked);
        if (typeof nextBookmarkCount === "number") {
          setLocalCount(nextBookmarkCount);
        }
      }
    } catch (error) {
      console.error("북마크 토글 실패", error);
    }
  }

  // onchange가 있으면 변경이 존재하므로 prop으로 받은 값을 사용하고, 없으면 로컬 상태를 사용
  const displayMarked = onChange ? marked : localMarked;
  const displayCount = onChange ? count : localCount;
  return (
    <button
      type="button"
      aria-label={`Bookmark ${displayCount}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/60 text-emerald-100 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-50 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
      onClick={handleClick}
    >
      <Bookmark
        className={`h-4 w-4 transition-colors ${
          displayMarked ? "fill-yellow-400 text-yellow-400" : "text-yellow-400"
        }`}
      />
      <span className="sr-only">북마크 {displayCount}</span>
    </button>
  );
}
