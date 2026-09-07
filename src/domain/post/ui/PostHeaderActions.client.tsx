"use client";

import { Bookmark } from "lucide-react";
import * as React from "react";

import { useAuth } from "@/app/auth/auth-context";
import {
  fetchPostBookmarkStatus,
  togglePostBookmark,
} from "@/domain/post/post_bookmark/api";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { isUnauthorizedApiError } from "@/lib/api/client";

type PostHeaderActionsProps = {
  postId: string;
  initialBookmarkCount: number;
};

function getReturnPath() {
  const current = new URL(window.location.href);
  return `${current.pathname}${current.search}${current.hash}`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function PostHeaderActions({
  postId,
  initialBookmarkCount,
}: PostHeaderActionsProps) {
  const [bookmarked, setBookmarked] = React.useState(false);
  const [bookmarkCount, setBookmarkCount] = React.useState(initialBookmarkCount);
  const [isPending, startTransition] = React.useTransition();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const statusRequestVersion = React.useRef(0);
  const statusAbortController = React.useRef<AbortController | null>(null);
  const mutationPending = React.useRef(false);

  React.useEffect(() => {
    setBookmarkCount(initialBookmarkCount);
  }, [initialBookmarkCount]);

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
        const next = await togglePostBookmark(postId);
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
    <div className="flex items-center gap-1 text-sm font-medium text-zinc-700">
      <button
        type="button"
        onClick={handleBookmark}
        disabled={isPending}
        aria-pressed={bookmarked}
        aria-label={`북마크 ${formatCount(bookmarkCount)}`}
        className="inline-flex h-11 items-center gap-2 rounded-md px-2.5 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Bookmark
          className={`h-4 w-4 ${bookmarked ? "fill-[#15933d] text-[#15933d]" : ""}`}
        />
        북마크 {formatCount(bookmarkCount)}
      </button>
    </div>
  );
}
