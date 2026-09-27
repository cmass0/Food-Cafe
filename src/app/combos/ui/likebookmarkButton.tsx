"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { fetchComboStatus } from "@/domain/combo/api";
import { ComboBookmarkResult } from "@/domain/combo/combo_bookmark/types";
import ComboCardBookmarkButton from "@/app/combos/ui/bookmarkbutton";
import { ComboLikeResult } from "@/domain/combo/combo_like/types";
import ComboCardLikeButton from "@/app/combos/ui/likebutton";
import { Combos } from "@/domain/combo/types";
import { useEffect, useState } from "react";

type props = {
  combo: Combos;
};
export default function ComboLikeBookmarkButton({ combo }: props) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(combo.likeCount ?? 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(combo.bookmarkCount ?? 0);
  const { user } = useAuth();

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
        console.error("조합 status fetch 실패", error);
      }
    })();

    return () => {
      active = false;
    };
  }, [combo.id, user?.id]);

  function handleLikeChange(next: ComboLikeResult) {
    setLiked(next.liked);
    setLikeCount(next.likeCount);
  }

  function handleBookmarkChange(next: ComboBookmarkResult) {
    setBookmarked(next.bookmarked);
    setBookmarkCount(next.bookmarkCount);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <ComboCardBookmarkButton
          comboId={combo.id}
          marked={bookmarked}
          count={bookmarkCount ?? 0}
          onChange={handleBookmarkChange}
        />
        <span className="text-sm text-slate-600">{bookmarkCount}</span>
      </div>
      <div className="flex items-center gap-1">
        <ComboCardLikeButton
          comboId={combo.id}
          liked={liked}
          count={likeCount ?? 0}
          onChange={handleLikeChange}
        />
        <span className="text-sm text-slate-600">{likeCount}</span>
      </div>
    </div>
  );
}
