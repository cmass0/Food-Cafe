"use client";

import { useAuth } from "@/app/auth/auth-context";
import { ToggleComboBookmark } from "@/domain/combo/combo_bookmark/type";
import { ToggleComboLike } from "@/domain/combo/combo_like/types";
import { fetchRecipeStatus } from "@/domain/recipe/api";
import RecipeCardBookmarkButton from "@/domain/recipe/recipe_bookmark/ui/bookmarkbtn";
import RecipeCardLikeButton from "@/domain/recipe/recipe_like/ui/likebutton";
import { Recipe } from "@/domain/recipe/types";
import { useEffect, useState } from "react";

type props = {
  recipe: Recipe;
};
export default function LikeBookmarkButton({
  recipe,
}: props) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(recipe.likeCount ?? 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(recipe.bookmarkCount ?? 0);
  const { user } = useAuth();

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

  function handleLikeChange(next: ToggleComboLike) {
    setLiked(next.liked);
    setLikeCount(next.likeCount);
  }

  function handleBookmarkChange(next: ToggleComboBookmark) {
    setBookmarkCount((prev) => {
      const delta = next.bookmarked === bookmarked ? 0 : next.bookmarked ? 1 : -1;
      return Math.max(0, prev + delta);
    });
    setBookmarked(next.bookmarked);
  }

  return (
    <div className="flex justify-end gap-2">
      <RecipeCardBookmarkButton
        recipeId={recipe.id}
        marked={bookmarked}
        count={bookmarkCount ?? 0}
        onChange={handleBookmarkChange}
      />
      <RecipeCardLikeButton
        recipeId={recipe.id}
        liked={liked}
        count={likeCount ?? 0}
        onChange={handleLikeChange}
      />
    </div>
  );
}
