"use client";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { Bookmark } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";
import { toggleRecipeBookmark } from "../api";

type Props = {
  recipeId: string;
  marked: boolean;
  count: number;
  onChange?(next: { marked: boolean }): void;
};

export default function BookmarkBtn({ recipeId, marked, count, onChange }: Props) {
  return (
    <React.Suspense fallback={null}>
      <BookmarkBtnInner recipeId={recipeId} marked={marked} count={count} onChange={onChange} />
    </React.Suspense>
  );
}

function BookmarkBtnInner({ recipeId, marked, count, onChange }: Props) {
  const [localMarked, setLocalMarked] = React.useState(marked);
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    setLocalMarked(marked);
  }, [marked]);

  async function handleClick() {
    const currentMarked = onChange ? marked : localMarked;
    if (!user) {
      const search = searchParams.toString();
      const next = search ? `${pathname}?${search}` : pathname || "/recipes";
      openAuthModal({ next });
      return;
    }

    try {
      const { bookmarked: nextMarked } = await toggleRecipeBookmark(recipeId, currentMarked);
      if (onChange) {
        onChange({ marked: nextMarked });
      } else {
        setLocalMarked(nextMarked);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    }
  }

  return (
    <button
      type="button"
      aria-label={`북마크 ${(onChange ? marked : localMarked) ? "해제" : "추가"} (현재 ${count})`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/60 bg-black/20 text-emerald-100 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
      onClick={handleClick}
    >
      <Bookmark
        className={`h-4 w-4 transition-colors ${
          (onChange ? marked : localMarked)
            ? "fill-emerald-400 text-emerald-400"
            : "text-emerald-100"
        }`}
      />
      <span className="sr-only">북마크 {count}</span>
    </button>
  );
}
