"use client";

import { Heart } from "lucide-react";
import * as React from "react";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { isUnauthorizedApiError } from "@/lib/api/client";

import { fetchPostLikeStatus, setPostLike } from "@/domain/post/post_like/api";

type PostLikeButtonProps = {
  postId: string;
  initialCount: number;
};

function getReturnPath() {
  const current = new URL(window.location.href);
  return `${current.pathname}${current.search}${current.hash}`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function PostLikeButton({ postId, initialCount }: PostLikeButtonProps) {
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(initialCount);
  const [isPending, startTransition] = React.useTransition();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const statusRequestVersion = React.useRef(0);
  const statusAbortController = React.useRef<AbortController | null>(null);
  const mutationPending = React.useRef(false);

  React.useEffect(() => {
    setLikeCount(initialCount);
  }, [initialCount]);

  React.useEffect(() => {
    if (!user?.id) {
      statusRequestVersion.current += 1;
      statusAbortController.current?.abort();
      statusAbortController.current = null;
      setLiked(false);
      return;
    }

    const requestVersion = statusRequestVersion.current + 1;
    const controller = new AbortController();
    statusRequestVersion.current = requestVersion;
    statusAbortController.current = controller;

    void fetchPostLikeStatus(postId, controller.signal)
      .then((status) => {
        if (!controller.signal.aborted && statusRequestVersion.current === requestVersion) {
          setLiked(status.liked);
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (!isUnauthorizedApiError(error)) {
          console.error("게시글 좋아요 상태를 불러오지 못했습니다.", error);
        }
      });

    return () => {
      controller.abort();
      if (statusAbortController.current === controller) {
        statusAbortController.current = null;
      }
    };
  }, [postId, user?.id]);

  function handleClick() {
    if (!user) {
      openAuthModal({ next: getReturnPath() });
      return;
    }

    if (mutationPending.current) return;
    mutationPending.current = true;

    statusRequestVersion.current += 1;
    statusAbortController.current?.abort();
    statusAbortController.current = null;

    const previousLiked = liked;
    const previousLikeCount = likeCount;
    const optimisticLiked = !previousLiked;

    setLiked(optimisticLiked);
    setLikeCount(Math.max(0, previousLikeCount + (optimisticLiked ? 1 : -1)));

    startTransition(async () => {
      try {
        const next = await setPostLike(postId, optimisticLiked);
        setLiked(next.liked);
        setLikeCount(next.likeCount);
      } catch (error) {
        setLiked(previousLiked);
        setLikeCount(previousLikeCount);

        if (isUnauthorizedApiError(error)) {
          openAuthModal({ next: getReturnPath() });
          return;
        }
        console.error("게시글 좋아요 처리에 실패했습니다.", error);
      } finally {
        mutationPending.current = false;
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={liked}
      aria-label={`좋아요 ${formatCount(likeCount)}`}
      className="inline-flex h-12 min-w-[96px] items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <Heart className={`h-5 w-5 text-red-400 ${liked ? "fill-red-400" : ""}`} />
      {formatCount(likeCount)}
    </button>
  );
}
