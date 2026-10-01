"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import LikeBookmarkButtons from "@/components/reactions/LikeBookmarkButtons";
import { useSingleFlight } from "@/hooks/useSingleFlight";
import { fetchRecipeStatus } from "@/domain/recipe/api";
import { setRecipeBookmark } from "@/domain/recipe/recipe_bookmark/api";
import { setRecipeLike } from "@/domain/recipe/recipe_like/api";
import type { Recipe } from "@/domain/recipe/types";
import { isUnauthorizedApiError } from "@/lib/errors/api-client";

type Props = {
  recipe: Recipe;
};

export default function LikeBookmarkButton({ recipe }: Props) {
  const [liked, setLiked] = useState(recipe.liked ?? false);
  const [likeCount, setLikeCount] = useState(recipe.likeCount ?? 0);
  const [bookmarked, setBookmarked] = useState(recipe.bookmarked ?? false);
  const [bookmarkCount, setBookmarkCount] = useState(recipe.bookmarkCount ?? 0);
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const likeFlight = useSingleFlight();
  const bookmarkFlight = useSingleFlight();

  useEffect(() => {
    setLikeCount(recipe.likeCount ?? 0);
    setBookmarkCount(recipe.bookmarkCount ?? 0);
  }, [recipe.likeCount, recipe.bookmarkCount]);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setLiked(false);
      setBookmarked(false);
      return;
    }

    (async () => {
      try {
        const status = await fetchRecipeStatus(recipe.id);
        if (!active) return;
        setLiked(status.liked);
        setBookmarked(status.bookmarked);
      } catch (error) {
        console.error("레시피 상태 가져오기 실패", error);
      }
    })();

    return () => {
      active = false;
    };
  }, [recipe.id, user?.id]);

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
        const next = await setRecipeBookmark(recipe.id, !bookmarked);
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
        console.error("북마크 처리 실패", error);
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
        const next = await setRecipeLike(recipe.id, !liked);
        setLiked(next.liked);
        if (typeof next.likeCount === "number") {
          setLikeCount(next.likeCount);
        }
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          requireAuth();
          return;
        }
        console.error("좋아요 처리 실패", error);
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
