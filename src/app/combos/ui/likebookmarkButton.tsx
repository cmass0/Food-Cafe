"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import LikeBookmarkButtons from "@/components/reactions/LikeBookmarkButtons";
import { useSingleFlight } from "@/hooks/useSingleFlight";
import { fetchComboStatus } from "@/domain/combo/api";
import { setComboBookmark } from "@/domain/combo/combo_bookmark/api";
import { setComboLike } from "@/domain/combo/combo_like/api";
import type { Combos } from "@/domain/combo/types";
import { isUnauthorizedApiError } from "@/lib/errors/api-client";

type Props = {
  combo: Combos;
};

// 레시피 상세의 좋아요·북마크 버튼과 같은 모양·동작을 쓴다.
export default function ComboLikeBookmarkButton({ combo }: Props) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(combo.likeCount ?? 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(combo.bookmarkCount ?? 0);
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const likeFlight = useSingleFlight();
  const bookmarkFlight = useSingleFlight();

  useEffect(() => {
    setLikeCount(combo.likeCount ?? 0);
    setBookmarkCount(combo.bookmarkCount ?? 0);
  }, [combo.likeCount, combo.bookmarkCount]);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setLiked(false);
      setBookmarked(false);
      return;
    }

    (async () => {
      try {
        const status = await fetchComboStatus(combo.id);
        if (!active) return;
        setLiked(status.liked);
        setBookmarked(status.bookmarked);
      } catch (error) {
        console.error("조합 상태 가져오기 실패", error);
      }
    })();

    return () => {
      active = false;
    };
  }, [combo.id, user?.id]);

  function requireAuth() {
    const current = new URL(window.location.href);
    openAuthModal({ next: `${current.pathname}${current.search}` });
  }

  async function handleBookmark() {
    if (!user) {
      requireAuth();
      return;
    }

    await bookmarkFlight.run(async () => {
      try {
        const next = await setComboBookmark(combo.id, !bookmarked);
        setBookmarked(next.bookmarked);
        if (typeof next.bookmarkCount === "number") {
          setBookmarkCount(next.bookmarkCount);
        }
      } catch (error) {
        // 요청 중에 로그인이 만료됐으면 다시 로그인하게 한다.
        if (isUnauthorizedApiError(error)) {
          requireAuth();
          return;
        }
        console.error("조합 북마크 처리 실패", error);
      }
    });
  }

  async function handleLike() {
    if (!user) {
      requireAuth();
      return;
    }

    await likeFlight.run(async () => {
      try {
        const next = await setComboLike(combo.id, !liked);
        setLiked(next.liked);
        if (typeof next.likeCount === "number") {
          setLikeCount(next.likeCount);
        }
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          requireAuth();
          return;
        }
        console.error("조합 좋아요 처리 실패", error);
      }
    });
  }

  return (
    <LikeBookmarkButtons
      liked={liked}
      likeCount={likeCount}
      onLike={handleLike}
      likeBusy={likeFlight.isRunning}
      bookmarked={bookmarked}
      bookmarkCount={bookmarkCount}
      onBookmark={handleBookmark}
      bookmarkBusy={bookmarkFlight.isRunning}
    />
  );
}
