"use client";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { Bookmark } from "lucide-react";
import * as React from "react";
import { toggleComboBookmark } from "../api";
import { ToggleComboBookmark } from "../type";

type Props = {
  comboId: string;
  marked: boolean;
  count: number;
  onChange?(next: ToggleComboBookmark): void;
};

export default function ComboCardBookmarkButton({ comboId, marked, count, onChange }: Props) {
  const [localMarked, setLocalMarked] = React.useState(marked);
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  React.useEffect(() => {
    setLocalMarked(marked);
  }, [marked]);

  async function handleClick() {
    const currentMarked = onChange ? marked : localMarked;
    if (!user) {
      const next = new URL(window.location.href);
      const nextUrl = `${next.pathname}${next.search}`;
      openAuthModal({ next: nextUrl });
      return;
    }

    try {
      const { bookmarked: nextMarked } = await toggleComboBookmark(comboId, currentMarked);
      if (onChange) {
        onChange({ bookmarked: nextMarked });
      } else {
        setLocalMarked(nextMarked);
      }
    } catch (error) {
      console.error("북마크 토글 실패:", error);
    }
  }

  return (
    <button
      type="button"
      aria-label={`북마크 ${(onChange ? marked : localMarked) ? "해제" : "추가"} (현재 ${count})`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/60 text-emerald-100 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-50 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
      onClick={handleClick}
    >
      <Bookmark
        className={`h-4 w-4 transition-colors ${
          (onChange ? marked : localMarked) ? "fill-yellow-400 text-yellow-400" : "text-yellow-400"
        }`}
      />
      <span className="sr-only">북마크 {count}</span>
    </button>
  );
}
