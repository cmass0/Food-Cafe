"use client";

import { Bookmark, Heart } from "lucide-react";

import { formatKoreanNumber } from "@/lib/format-number";

// 레시피·조합 상세 화면이 함께 쓰는 북마크·좋아요 버튼 모양. 상태와 요청은 부르는 쪽이 맡는다.
type Props = {
  liked: boolean;
  likeCount: number;
  onLike: () => void;
  likeBusy?: boolean;
  bookmarked: boolean;
  bookmarkCount: number;
  onBookmark: () => void;
  bookmarkBusy?: boolean;
};

function formatCount(value: number) {
  return formatKoreanNumber(value);
}

export default function LikeBookmarkButtons({
  liked,
  likeCount,
  onLike,
  likeBusy = false,
  bookmarked,
  bookmarkCount,
  onBookmark,
  bookmarkBusy = false,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBookmark}
        disabled={bookmarkBusy}
        aria-pressed={bookmarked}
        className="inline-flex h-12 min-w-[72px] items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
        aria-label={`북마크 ${formatCount(bookmarkCount)}`}
      >
        <Bookmark className={`h-5 w-5 text-amber-400 ${bookmarked ? "fill-amber-400" : ""}`} />
        {formatCount(bookmarkCount)}
      </button>
      <button
        type="button"
        onClick={onLike}
        disabled={likeBusy}
        aria-pressed={liked}
        className="inline-flex h-12 min-w-[72px] items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 shadow-sm transition hover:border-red-200 hover:bg-red-50"
        aria-label={`좋아요 ${formatCount(likeCount)}`}
      >
        <Heart className={`h-5 w-5 text-red-400 ${liked ? "fill-red-400" : ""}`} />
        {formatCount(likeCount)}
      </button>
    </div>
  );
}
