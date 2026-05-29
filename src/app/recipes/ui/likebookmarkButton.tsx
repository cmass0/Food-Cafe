"use client";

import { Bookmark, Heart } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { fetchRecipeStatus } from "@/domain/recipe/api";
import { toggleRecipeBookmark } from "@/domain/recipe/recipe_bookmark/api";
import { toggleRecipeLike } from "@/domain/recipe/recipe_like/api";
import type { Recipe } from "@/domain/recipe/types";

type Props = {
  recipe: Recipe;
};

function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

export default function LikeBookmarkButton({ recipe }: Props) {
  const [liked, setLiked] = useState(recipe.liked ?? false);
  const [likeCount, setLikeCount] = useState(recipe.likeCount ?? 0);
  const [bookmarked, setBookmarked] = useState(recipe.bookmarked ?? false);
  const [bookmarkCount, setBookmarkCount] = useState(recipe.bookmarkCount ?? 0);
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

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

    try {
      const next = await toggleRecipeBookmark(recipe.id, bookmarked);
      setBookmarked(next.bookmarked);
      if (typeof next.bookmarkCount === "number") {
        setBookmarkCount(next.bookmarkCount);
      }
    } catch (error) {
      console.error("북마크 토글 실패", error);
    }
  }

  async function handleLike() {
    if (!user) {
      requireAuth();
      return;
    }

    try {
      const next = await toggleRecipeLike(recipe.id);
      setLiked(next.liked);
      if (typeof next.likeCount === "number") {
        setLikeCount(next.likeCount);
      }
    } catch (error) {
      console.error("좋아요 토글 실패", error);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleBookmark}
        className="inline-flex h-12 min-w-[72px] items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
        aria-label={`북마크 ${formatCount(bookmarkCount)}`}
      >
        <Bookmark className={`h-5 w-5 text-amber-400 ${bookmarked ? "fill-amber-400" : ""}`} />
        {formatCount(bookmarkCount)}
      </button>
      <button
        type="button"
        onClick={handleLike}
        className="inline-flex h-12 min-w-[72px] items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 shadow-sm transition hover:border-red-200 hover:bg-red-50"
        aria-label={`좋아요 ${formatCount(likeCount)}`}
      >
        <Heart className={`h-5 w-5 text-red-400 ${liked ? "fill-red-400" : ""}`} />
        {formatCount(likeCount)}
      </button>
    </div>
  );
}
