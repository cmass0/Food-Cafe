"use client";

import { Bookmark, Check, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

type PostHeaderActionsProps = {
  postId: string;
  postTitle: string;
};

function bookmarkStorageKey(postId: string) {
  return `wellins:post-bookmark:${postId}`;
}

export default function PostHeaderActions({ postId, postTitle }: PostHeaderActionsProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    setBookmarked(window.localStorage.getItem(bookmarkStorageKey(postId)) === "true");
  }, [postId]);

  function toggleBookmark() {
    setBookmarked((current) => {
      const next = !current;
      window.localStorage.setItem(bookmarkStorageKey(postId), String(next));
      return next;
    });
  }

  async function sharePost() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: postTitle, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") {
        console.error("게시글 공유에 실패했습니다.", error);
      }
    }
  }

  return (
    <div className="flex items-center gap-1 text-sm font-medium text-zinc-700">
      <button
        type="button"
        onClick={toggleBookmark}
        aria-pressed={bookmarked}
        className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 transition hover:bg-zinc-100"
      >
        <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-[#15933d] text-[#15933d]" : ""}`} />
        북마크
      </button>
      <button
        type="button"
        onClick={sharePost}
        className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 transition hover:bg-zinc-100"
      >
        {shared ? <Check className="h-4 w-4 text-[#15933d]" /> : <Share2 className="h-4 w-4" />}
        {shared ? "복사됨" : "공유"}
      </button>
    </div>
  );
}
