"use client";

import { Bookmark } from "lucide-react";
import * as React from "react";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { isUnauthorizedApiError } from "@/lib/api/client";
import { toggleRecipeBookmark } from "../api";
import { ToggleRecipeBookmark } from "../type";

type Props = {
  recipeId: string;
  marked: boolean;
  count: number;
  onChange?(next: ToggleRecipeBookmark): void;
};

function currentNextUrl() {
  const next = new URL(window.location.href);
  return `${next.pathname}${next.search}`;
}

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
      openAuthModal({ next: currentNextUrl() });
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
      if (isUnauthorizedApiError(error)) {
        openAuthModal({ next: currentNextUrl() });
        return;
      }
      console.error("레시피 북마크 토글 실패:", error);
    }
  }

  const displayMarked = onChange ? marked : localMarked;
  const displayCount = onChange ? count : localCount;

  return (
    <button
      type="button"
      aria-label={`북마크 ${displayCount}`}
      className="group inline-grid h-11 w-11 cursor-pointer place-items-center rounded-full text-emerald-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900 disabled:cursor-not-allowed disabled:opacity-70"
      onClick={handleClick}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full border border-emerald-300/60 shadow-sm transition group-hover:border-emerald-200 group-hover:bg-emerald-500/20 group-hover:text-emerald-50">
        <Bookmark
          className={`h-4 w-4 transition-colors ${
            displayMarked ? "fill-yellow-400 text-yellow-400" : "text-yellow-400"
          }`}
          aria-hidden="true"
        />
      </span>
      <span className="sr-only">북마크 {displayCount}</span>
    </button>
  );
}
