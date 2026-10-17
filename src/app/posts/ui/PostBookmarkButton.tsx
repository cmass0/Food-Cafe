"use client";

import { Bookmark } from "lucide-react";
import * as React from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchPostBookmarkStatus,
  setPostBookmark,
} from "@/domain/post/post_bookmark/api";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { isUnauthorizedApiError } from "@/lib/errors/api-client";
import { formatKoreanNumber } from "@/lib/format-number";

type PostBookmarkButtonProps = {
  postId: string;
  initialCount: number;
};

function getReturnPath() {
  const current = new URL(window.location.href);
  return `${current.pathname}${current.search}${current.hash}`;
}

function formatCount(value: number) {
  return formatKoreanNumber(value);
}

export default function PostBookmarkButton({ postId, initialCount }: PostBookmarkButtonProps) {
  const [bookmarked, setBookmarked] = React.useState(false);
  const [bookmarkCount, setBookmarkCount] = React.useState(initialCount);
  const [isPending, startTransition] = React.useTransition();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const statusRequestVersion = React.useRef(0);
  const statusAbortController = React.useRef<AbortController | null>(null);
  const mutationPending = React.useRef(false);

  React.useEffect(() => {
    setBookmarkCount(initialCount);
  }, [initialCount]);

  React.useEffect(() => {
    if (!user?.id) {
      statusRequestVersion.current += 1;
      statusAbortController.current?.abort();
      statusAbortController.current = null;
      setBookmarked(false);
      return;
    }

    const requestVersion = statusRequestVersion.current + 1;
    const controller = new AbortController();
    statusRequestVersion.current = requestVersion;
    statusAbortController.current = controller;

    void fetchPostBookmarkStatus(postId, controller.signal)
      .then((status) => {
        if (!controller.signal.aborted && statusRequestVersion.current === requestVersion) {
          setBookmarked(status.bookmarked);
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (!isUnauthorizedApiError(error)) {
          console.error("게시글 북마크 상태를 불러오지 못했습니다.", error);
        }
      });

    return () => {
      controller.abort();
      if (statusAbortController.current === controller) {
        statusAbortController.current = null;
      }
    };
  }, [postId, user?.id]);

  function handleBookmark() {
    if (!user) {
      openAuthModal({ next: getReturnPath() });
      return;
    }

    if (mutationPending.current) return;
    mutationPending.current = true;

    statusRequestVersion.current += 1;
    statusAbortController.current?.abort();
    statusAbortController.current = null;

    const previousBookmarked = bookmarked;
    const previousBookmarkCount = bookmarkCount;
    const optimisticBookmarked = !previousBookmarked;

    setBookmarked(optimisticBookmarked);
    setBookmarkCount(
      Math.max(0, previousBookmarkCount + (optimisticBookmarked ? 1 : -1))
    );

    startTransition(async () => {
      try {
        const next = await setPostBookmark(postId, optimisticBookmarked);
        setBookmarked(next.bookmarked);
        setBookmarkCount(next.bookmarkCount);
      } catch (error) {
        setBookmarked(previousBookmarked);
        setBookmarkCount(previousBookmarkCount);

        if (isUnauthorizedApiError(error)) {
          openAuthModal({ next: getReturnPath() });
          return;
        }
        console.error("게시글 북마크 처리에 실패했습니다.", error);
      } finally {
        mutationPending.current = false;
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleBookmark}
      disabled={isPending}
      aria-pressed={bookmarked}
      aria-label={`북마크 ${formatCount(bookmarkCount)}`}
      className="inline-flex h-12 min-w-[96px] items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <Bookmark className={`h-5 w-5 text-amber-400 ${bookmarked ? "fill-amber-400" : ""}`} />
      {formatCount(bookmarkCount)}
    </button>
  );
}
