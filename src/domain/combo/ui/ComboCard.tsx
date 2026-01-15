"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ToggleComboBookmark } from "@/domain/combo/combo_bookmark/type";
import ComboCardBookmarkButton from "@/domain/combo/combo_bookmark/ui/bookmarkbutton";
import type { ToggleComboLike } from "@/domain/combo/combo_like/types";
import ComboCardLikeButton from "@/domain/combo/combo_like/ui/likebutton";
import type { Combos } from "@/domain/combo/types";
import { Bookmark, Eye, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type ComboCardProps = {
  combo: Combos;
  isActive: boolean;
  onSelect: () => void;
};

export default function ComboCard({ combo, isActive, onSelect }: ComboCardProps) {
  const initialLiked = (combo as { liked?: boolean }).liked ?? false;
  const initialBookmarked = (combo as { bookmarked?: boolean }).bookmarked ?? false;
  const [liked, setLiked] = useState<boolean>(initialLiked);
  const [likeCount, setLikeCount] = useState<number>(combo.likeCount ?? 0);
  const [bookmarked, setBookmarked] = useState<boolean>(initialBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState<number>(combo.bookmarkCount ?? 0);

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
    <Card
      key={combo.id}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`group h-[170px] overflow-hidden rounded-2xl border border-muted-foreground/20 bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isActive ? "ring-2 ring-emerald-400/60" : ""
      }`}
    >
      <div className="flex h-full">
        <div className="relative h-full w-32 shrink-0 overflow-hidden bg-muted/30 sm:w-36">
          {combo.image ? (
            <Image
              src={combo.image}
              alt={combo.title || "조합 이미지"}
              fill
              sizes="(max-width: 1280px) 100vw, 160px"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              이미지 없음
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between gap-2 p-3">
          <div className="space-y-1">
            <div className="flex flex-col flex-wrap items-start gap-2">
              <h2 className="line-clamp-1 text-sm font-semibold">{combo.title}</h2>
              <div className="flex gap-1 overflow-hidden truncate">
                {combo.difficulty ? (
                  <Badge className="border border-emerald-400/30 bg-emerald-500/10 text-black hover:text-white">
                    {combo.difficulty}
                  </Badge>
                ) : null}
                {combo.timeMinutes ? (
                  <Badge className="border border-emerald-400/30 bg-emerald-500/10 text-black hover:text-white">
                    {combo.timeMinutes}분
                  </Badge>
                ) : null}
              </div>
            </div>
            <div>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {combo.summary || "설명이 없습니다."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Heart className="h-3 w-3 fill-red-400 text-red-400" />
              {likeCount}
            </span>
            <span className="flex items-center gap-1.5">
              <Bookmark className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {bookmarkCount}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-3 w-3 text-black" /> {combo.viewCount ?? 0}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="h-7 rounded-full hover:bg-emerald-500 hover:text-white"
            >
              <Link href={`/combos/${combo.id}`}>상세보기</Link>
            </Button>
            <div className="flex gap-2">
              <ComboCardBookmarkButton
                comboId={combo.id}
                marked={bookmarked}
                count={bookmarkCount}
                onChange={handleBookmarkChange}
              />
              <ComboCardLikeButton
                comboId={combo.id}
                liked={liked}
                count={likeCount}
                onChange={handleLikeChange}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
